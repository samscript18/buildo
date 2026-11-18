import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { Job, Asset, view } from "./models";
import { ownProject } from "./projects";
import { body, id, pagination, rate } from "./http";
import { configured, fail } from "./errors";
import { createLux, queryLux } from "./lux3d";
import {
  downloadModel,
  uploadModel,
  verifyModelDelivery,
  assertModelStorage,
} from "./storage";
import { generationFailure, type TransferStage } from "./generation-failures";
import type { JobRecord } from "./models";
export function generationView(record: JobRecord) {
  const {
    transferCheckpoint: _checkpoint,
    leaseToken: _token,
    leaseUntil: _lease,
    requestHash: _hash,
    activeSlot: _slot,
    ...safe
  } = record;
  void _checkpoint;
  void _token;
  void _lease;
  void _hash;
  void _slot;
  return view(safe);
}
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
      ).map(generationView),
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
    return generationView(existing.toObject());
  }
  configured("LUX3D_API_KEY");
  configured("CLOUDINARY_CLOUD_NAME");
  configured("CLOUDINARY_API_KEY");
  configured("CLOUDINARY_API_SECRET");
  configured("LUX3D_DOWNLOAD_HOSTS");
  await rate(`generation:${user.id}`, 4, 3600);
  await assertModelStorage();
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
  return generationView(job.toObject());
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
      {
        _id: job._id,
        state: { $in: ["queued", "generating"] },
        providerTaskId: { $exists: false },
      },
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
    !["generating", "transferring", "transfer_failed"].includes(job.state) ||
    job.failure?.retryable === false ||
    (job.transferAttempts || 0) >= 8
  )
    return generationView(job.toObject());
  const token = crypto.randomUUID();
  const lease = await Job.findOneAndUpdate(
    {
      _id: job._id,
      ownerId: user.id,
      state: { $in: ["generating", "transferring", "transfer_failed"] },
      "failure.retryable": { $ne: false },
      $and: [
        {
          $or: [
            { transferAttempts: { $exists: false } },
            { transferAttempts: { $lt: 8 } },
          ],
        },
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
        leaseToken: token,
        leaseUntil: new Date(Date.now() + 300000),
        nextPollAt: new Date(Date.now() + 15000),
      },
    },
    { returnDocument: "after" },
  );
  if (!lease) return generationView(job.toObject());
  let stage: TransferStage = "provider_status";
  async function persist() {
    const record = lease!.toObject();
    const fields = [
      "state",
      "stage",
      "safeError",
      "outputHost",
      "nextPollAt",
      "transferCheckpoint",
      "transferAttempts",
      "recoveryFailures",
      "failure",
      "failureHistory",
      "assetId",
      "activeSlot",
    ] as const;
    const set: Record<string, unknown> = {},
      unset: Record<string, 1> = {};
    for (const field of fields) {
      if (record[field] === undefined) unset[field] = 1;
      else set[field] = record[field];
    }
    const updated = await Job.updateOne(
      { _id: lease!._id, leaseToken: token },
      { $set: set, $unset: unset },
    );
    if (!updated.matchedCount)
      fail(
        409,
        "LEASE_LOST",
        "Recovery is already being handled by another process.",
      );
  }
  async function setStage(
    next: TransferStage,
    checkpoint?: Awaited<ReturnType<typeof uploadModel>>,
  ) {
    stage = next;
    lease!.stage = next;
    if (checkpoint) lease!.transferCheckpoint = checkpoint;
    await persist();
  }
  try {
    lease.safeError = undefined;
    lease.failure = undefined;
    let stored = lease.transferCheckpoint;
    if (!stored) {
      await setStage("provider_status");
      const result = await queryLux(lease.providerTaskId!);
      if (result.status === 4 || result.status === 6) {
        lease.state = "failed";
        lease.safeError =
          "The provider did not produce an asset. Buildo will not submit another generation automatically.";
        lease.activeSlot = undefined;
      } else if (result.status === 3) {
        lease.state = "transferring";
        const output = result.outputs.find((o) => {
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
            "The provider has not returned a usable GLB.",
          );
        lease.state = "transferring";
        lease.outputHost = new URL(output.content).hostname;
        lease.transferAttempts = (lease.transferAttempts || 0) + 1;
        await setStage("download");
        stored = await uploadModel(
          await downloadModel(output.content),
          user.id,
          setStage,
        );
      } else if (Date.now() - lease.createdAt.getTime() > 2 * 3600000) {
        lease.state = "timed_out";
        lease.safeError =
          "Generation is taking longer than expected. Check the provider account; Buildo will not resubmit.";
        lease.activeSlot = undefined;
      }
    } else {
      lease.state = "transferring";
      lease.transferAttempts = (lease.transferAttempts || 0) + 1;
      await setStage("verify_delivery");
      await verifyModelDelivery(stored);
    }
    if (stored) {
      await setStage("persist_asset");
      const asset = await Asset.findOneAndUpdate(
        { generationId: String(lease._id) },
        {
          $setOnInsert: {
            ...stored,
            ownerId: user.id,
            name: lease.prompt.slice(0, 70),
            source: "Lux3D API",
            sourceUrl:
              "https://api.aholo.ai/global/lux3d/v1/generate/task/get?taskid=" +
              encodeURIComponent(lease.providerTaskId!),
            taskId: lease.providerTaskId,
            prompt: lease.prompt,
            allowReuse: lease.allowReuse || false,
            rightsConfirmed: lease.allowReuse || false,
            generationId: String(lease._id),
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      lease.state = "ready";
      lease.assetId = String(asset._id);
      lease.safeError = undefined;
      lease.failure = undefined;
      lease.recoveryFailures = 0;
      lease.activeSlot = undefined;
      lease.transferCheckpoint = undefined;
    }
    await persist();
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "LEASE_LOST"
    )
      return generationView((await Job.findById(lease._id))!.toObject());
    const detail = generationFailure(error, stage);
    const reference = crypto.randomUUID();
    const failure = {
      code: detail.code,
      stage,
      retryable: detail.retryable,
      at: new Date(),
      reference,
    };
    lease.failure = failure;
    lease.failureHistory = [...(lease.failureHistory || []).slice(-9), failure];
    if (lease.state === "transferring" || lease.state === "transfer_failed")
      lease.state = "transfer_failed";
    lease.safeError = detail.message;
    lease.recoveryFailures = (lease.recoveryFailures || 0) + 1;
    const retries = lease.recoveryFailures;
    if (!detail.retryable || retries >= 8) {
      lease.failure.retryable = false;
      lease.safeError = detail.message.replace(
        "Delivery will retry",
        "Automatic delivery retries have paused. Use Retry delivery after checking the issue",
      );
      lease.activeSlot = undefined;
    }
    lease.nextPollAt = new Date(
      Date.now() + Math.min(15 * 60000, 30000 * 2 ** Math.min(retries - 1, 5)),
    );
    console.error("Generation delivery attempt failed", {
      jobId: String(lease._id),
      ...failure,
    });
    await persist();
  } finally {
    await Job.updateOne(
      { _id: lease._id, leaseToken: token },
      { $unset: { leaseUntil: 1, leaseToken: 1 } },
    );
  }
  return generationView((await Job.findById(lease._id))!.toObject());
}

export async function retryGenerationTransfer(
  jobId: string,
  user: { id: string },
) {
  await rate(`delivery-retry:${user.id}`, 6, 60);
  const updated = await Job.findOneAndUpdate(
    {
      _id: id(jobId),
      ownerId: user.id,
      state: { $in: ["transfer_failed", "generating"] },
      providerTaskId: { $exists: true },
      $or: [
        { leaseUntil: { $exists: false } },
        { leaseUntil: { $lt: new Date() } },
      ],
    },
    {
      $set: {
        transferAttempts: 0,
        recoveryFailures: 0,
        nextPollAt: new Date(),
      },
      $unset: { failure: 1, safeError: 1 },
    },
    { returnDocument: "after" },
  );
  if (!updated)
    fail(
      409,
      "DELIVERY_BUSY",
      "This delivery is not available for retry yet. Refresh its status.",
    );
  return generationItem(jobId, user);
}

export async function reconcileDueGenerations(limit = 10) {
  const now = new Date();
  const due = await Job.find({
    state: { $in: ["queued", "generating", "transferring", "transfer_failed"] },
    "failure.retryable": { $ne: false },
    $and: [
      {
        $or: [
          { nextPollAt: { $exists: false } },
          { nextPollAt: { $lte: now } },
        ],
      },
      {
        $or: [
          { leaseUntil: { $exists: false } },
          { leaseUntil: { $lte: now } },
        ],
      },
    ],
  })
    .sort({ nextPollAt: 1, createdAt: 1 })
    .limit(Math.max(1, Math.min(20, limit)))
    .select("ownerId")
    .lean();
  const results = [];
  for (const item of due) {
    const result = await generationItem(String(item._id), { id: item.ownerId });
    results.push({ id: result.id, state: result.state });
  }
  return results;
}
