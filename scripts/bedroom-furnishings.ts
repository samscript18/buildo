// Explicitly authorized two-object run. Persisted idempotency; never automatically resubmit.
import mongoose from "mongoose";
import { db } from "../src/server/db";
import { Job } from "../src/server/models";
import {
  generationCollection,
  generationItem,
} from "../src/server/generations";
import { ownProject } from "../src/server/projects";

const [email, projectId] = process.argv.slice(2);
const plans = [
  {
    name: "Bed with oak frame and bedding",
    requestKey: "8ad85c06-d161-450c-a387-67fa4514a728",
    prompt:
      "One complete contemporary double bed, warm oak wooden bedframe with low legs and rounded upholstered headboard, mattress fitted inside the frame, cream linen duvet and two soft pillows, cohesive realistic furniture assembly, isolated single furniture object, no room, no floor, no surrounding objects",
  },
  {
    name: "Oak TV shelf with television",
    requestKey: "a613e1ec-0510-4d68-8c7d-a2f619377dbc",
    prompt:
      "One contemporary low oak television console shelf with open storage compartments and short legs, a modern flat screen television standing securely centered on top, dark black screen, cohesive realistic furniture assembly, isolated single furniture object, no room, no wall, no surrounding objects",
  },
];
try {
  if (!email || !projectId)
    throw new Error("Provide account email and project ID.");
  await db();
  const user = await mongoose.connection
    .db!.collection("user")
    .findOne({ email: email.toLowerCase() }, { projection: { _id: 1 } });
  if (!user) throw new Error("Account not found.");
  const ownerId = String(user._id);
  await ownProject(projectId, ownerId);
  for (const plan of plans) {
    const job = await Job.findOne({ ownerId, requestKey: plan.requestKey });
    if (job && job.projectId !== projectId)
      throw new Error(
        "Existing authorized request belongs to a different project.",
      );
    if (!job) {
      if (!process.argv.includes("--submit-authorized"))
        throw new Error(
          "Pass --submit-authorized only after user authorization for these two generations.",
        );
      const result = await generationCollection(
        new Request("http://localhost/api/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            prompt: plan.prompt,
            style: "photorealistic",
            allowReuse: false,
            requestKey: plan.requestKey,
          }),
        }),
        { id: ownerId },
      );
      console.log(
        JSON.stringify({
          name: plan.name,
          jobId: result.id,
          state: result.state,
          providerTaskId: result.providerTaskId,
        }),
      );
      break;
    }
    const result = await generationItem(String(job._id), { id: ownerId });
    console.log(
      JSON.stringify({
        name: plan.name,
        jobId: result.id,
        state: result.state,
        providerTaskId: result.providerTaskId,
        outputHost: result.outputHost,
        assetId: result.assetId,
        safeError: result.safeError,
      }),
    );
    if (result.state !== "ready") break;
  }
} catch (error) {
  console.error(
    "Furnishing run paused:",
    error instanceof Error ? error.name : "Unknown",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
