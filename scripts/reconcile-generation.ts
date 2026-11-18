// Trusted local operator command: resumes one existing owned job, never creates a generation.
import mongoose from "mongoose";
import { db } from "../src/server/db";
import { Job, Asset } from "../src/server/models";
import {
  generationItem,
  retryGenerationTransfer,
} from "../src/server/generations";
import { queryLux } from "../src/server/lux3d";
import { downloadModel } from "../src/server/storage";
import { inspectGlb } from "../src/lib/glb";
import { AppError } from "../src/server/errors";

const [email, jobId] = process.argv.slice(2);
if (!email || !jobId || !mongoose.isValidObjectId(jobId))
  throw new Error(
    "Usage: reconcile-generation.ts <account-email> <existing-job-id>",
  );
try {
  await db();
  const user = await mongoose.connection
    .db!.collection("user")
    .findOne({ email: email.toLowerCase() }, { projection: { _id: 1 } });
  if (!user) throw new Error("Account not found.");
  const ownerId = String(user._id);
  const existing = await Job.findOne({ _id: jobId, ownerId });
  if (!existing) throw new Error("No job owned by that account.");
  if (process.argv.includes("--inspect-output")) {
    if (!existing.providerTaskId)
      throw new Error("No confirmed provider task.");
    const provider = await queryLux(existing.providerTaskId);
    console.log(JSON.stringify({ stage: "provider", status: provider.status }));
    const output = provider.outputs.find((o) =>
      new URL(o.content).pathname.toLowerCase().endsWith(".glb"),
    );
    if (!output) throw new Error("No GLB output.");
    const bytes = await downloadModel(output.content);
    console.log(JSON.stringify({ stage: "downloaded", bytes: bytes.length }));
    const model = await inspectGlb(bytes);
    console.log(JSON.stringify({ stage: "validated", model }));
  } else {
    const result = process.argv.includes("--retry-delivery")
      ? await retryGenerationTransfer(jobId, { id: ownerId })
      : await generationItem(jobId, { id: ownerId });
    const asset = result.assetId
      ? await Asset.findOne({ _id: result.assetId, ownerId }).lean()
      : null;
    console.log(
      JSON.stringify(
        {
          jobId,
          state: result.state,
          providerTaskId: result.providerTaskId,
          outputHost: result.outputHost,
          safeError: result.safeError,
          asset: asset
            ? {
                id: String(asset._id),
                format: asset.format,
                bytes: asset.bytes,
                resourceType: asset.resourceType,
                sha256: asset.sha256,
                bounds: asset.bounds,
                normalization: asset.normalization,
                deliveryPreparation: asset.deliveryPreparation,
              }
            : undefined,
        },
        null,
        2,
      ),
    );
  }
} catch (error) {
  console.error(
    "Reconciliation failed:",
    error instanceof Error ? error.name : "Unknown",
  );
  if (error instanceof AppError) console.error(error.code, error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
