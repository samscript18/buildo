import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { Job, Asset, view } from "./models";
import { ownProject } from "./projects";
import { body, id, pagination, rate } from "./http";
import { configured, fail } from "./errors";
import { createLux, queryLux } from "./lux3d";
import { downloadModel, uploadModel } from "./storage";
export async function generationCollection(
  request: Request,
  user: { id: string },
) {
  if (request.method === "GET") {
    const { skip, limit } = pagination(request);
    return {
      items: (
        await Job.find({ ownerId: user.id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
      ).map((j) => ({
        ...view(j),
        requestHash: undefined,
        leaseUntil: undefined,
        activeSlot: undefined,
      })),
    };
  }
  const input = z
    .object({
      projectId: z.string(),
      prompt: z.string().trim().min(5).max(1200),
      style: z
        .enum([
          "photorealistic",
          "cartoon",
          "anime",
          "hand_painted",
          "cyberpunk",
          "fantasy",
          "glass",
        ])
        .default("photorealistic"),
      requestKey: z.uuid(),
      allowReuse: z.boolean().default(false),
    })
    .strict()
    .parse(await body(request));
  await ownProject(input.projectId, user.id);
  const requestHash = createHash("sha256")
    .update(
      JSON.stringify([
        input.projectId,
        input.prompt,
        input.style,
        input.allowReuse,
      ]),
    )
    .digest("hex");
  const existing = await Job.findOne({
    ownerId: user.id,
    requestKey: input.requestKey,
  });
  if (existing) {
    if (existing.requestHash !== requestHash)
      fail(
        409,
        "IDEMPOTENCY",
        "This request key was already used for a different prompt.",
      );
    return view(existing.toObject());
  }
  configured("LUX3D_API_KEY");
  configured("CLOUDINARY_CLOUD_NAME");
  configured("CLOUDINARY_API_KEY");
  configured("CLOUDINARY_API_SECRET");
  await rate(`generation:${user.id}`, 4, 3600);
  const job = await Job.create({
    ...input,
    ownerId: user.id,
    requestHash,
    state: "queued",
    activeSlot: "generation",
  });
  try {
    job.state = "generating";
    job.attempts = 1;
    await job.save();
    job.providerTaskId = await createLux(input.prompt, input.style);
    job.nextPollAt = new Date(Date.now() + 10000);
    await job.save();
  } catch {
    job.state = "unknown";
    job.safeError =
      "Submission could not be confirmed. Do not resubmit until the provider account has been checked.";
    await job.save();
  }
  return view(job.toObject());
}
export async function generationItem(jobId: string, user: { id: string }) {
  let job = await Job.findOne({ _id: id(jobId), ownerId: user.id });
  if (!job) fail(404, "NOT_FOUND", "Generation not found.");
  if (
    ["queued", "generating"].includes(job.state) &&
    !job.providerTaskId &&
    Date.now() - job.createdAt.getTime() > 60000
  ) {
    await Job.updateOne(
      { _id: job._id, state: { $in: ["queued", "generating"] } },
      {
        $set: {
          state: "unknown",
          safeError:
            "Submission was interrupted. Check the provider account before retrying.",
        },
      },
    );
    job = (await Job.findById(job._id))!;
  }
  if (
    !job.providerTaskId ||
    !["generating", "transferring", "transfer_failed"].includes(job.state)
  )
    return view(job.toObject());
  const lease = await Job.findOneAndUpdate(
    {
      _id: job._id,
      ownerId: user.id,
      state: { $in: ["generating", "transferring", "transfer_failed"] },
      $and: [
        {
          $or: [
            { leaseUntil: { $exists: false } },
            { leaseUntil: { $lt: new Date() } },
          ],
        },
        {
          $or: [
            { nextPollAt: { $exists: false } },
            { nextPollAt: { $lte: new Date() } },
          ],
        },
      ],
    },
    {
      $set: {
        leaseUntil: new Date(Date.now() + 180000),
        nextPollAt: new Date(Date.now() + 15000),
      },
    },
    { returnDocument: "after" },
  );
  if (!lease) return view(job.toObject());
  try {
    const result = await queryLux(lease.providerTaskId!);
    lease.safeError = undefined;
    if (result.status === 4 || result.status === 6) {
      lease.state = "failed";
      lease.safeError =
        "The provider did not produce an asset. A new request requires an explicit action.";
      lease.activeSlot = undefined;
    } else if (result.status === 3) {
      const output = result.outputs?.find((o) => {
        try {
          return new URL(o.content).pathname.toLowerCase().endsWith(".glb");
        } catch {
          return false;
        }
      });
      if (!output)
        fail(
          502,
          "OUTPUT_FORMAT",
          "No usable GLB output was returned. Import a self-contained export instead.",
        );
      lease.state = "transferring";
      lease.outputHost = new URL(output.content).hostname;
      await lease.save();
      let asset = await Asset.findOne({ generationId: String(lease._id) });
      if (!asset) {
        const stored = await uploadModel(
          await downloadModel(output.content),
          user.id,
        );
        asset = await Asset.create({
          ...stored,
          ownerId: user.id,
          name: lease.prompt.slice(0, 70),
          source: "Lux3D API",
          sourceUrl: output.content,
          taskId: lease.providerTaskId,
          prompt: lease.prompt,
          allowReuse: lease.allowReuse || false,
          rightsConfirmed: lease.allowReuse || false,
          generationId: String(lease._id),
        });
      }
      lease.state = "ready";
      lease.assetId = String(asset._id);
      lease.safeError = undefined;
      lease.activeSlot = undefined;
    } else if (Date.now() - lease.createdAt.getTime() > 2 * 3600000) {
      lease.state = "timed_out";
      lease.safeError =
        "Generation is taking longer than expected. Check the provider account; Buildo will not resubmit.";
      lease.activeSlot = undefined;
    }
  } catch (error) {
    console.error("Generation reconciliation paused", {
      jobId: String(lease._id),
      stage: lease.state,
      type: error instanceof Error ? error.name : "StorageError",
      code:
        typeof error === "object" && error && "code" in error
          ? String(error.code).slice(0, 80)
          : undefined,
    });
    lease.state =
      lease.state === "transferring" ? "transfer_failed" : lease.state;
    lease.safeError =
      "Status or asset transfer could not be completed. Refresh to retry delivery; no new generation will be submitted.";
    lease.nextPollAt = new Date(Date.now() + 60000);
  } finally {
    lease.leaseUntil = undefined;
    await lease.save();
  }
  return view(lease.toObject());
}
