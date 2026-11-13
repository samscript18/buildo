// Explicit local operator action for the user's requested bedroom; CAS preserves newer edits.
import mongoose from "mongoose";
import { db } from "../src/server/db";
import { Asset, Job } from "../src/server/models";
import { ownProject, projectItem } from "../src/server/projects";

const [email, projectId] = process.argv.slice(2);
try {
  if (!email || !projectId)
    throw new Error(
      "Provide the authorized account email and bedroom project ID.",
    );
  await db();
  const user = await mongoose.connection
    .db!.collection("user")
    .findOne({ email: email.toLowerCase() }, { projection: { _id: 1 } });
  if (!user) throw new Error("Account not found.");
  const ownerId = String(user._id);
  const project = await ownProject(projectId, ownerId);
  const scene = structuredClone(project.scene);
  const plans = [
    {
      requestKey: "8ad85c06-d161-450c-a387-67fa4514a728",
      position: [0, 0, -scene.room.depth / 2 + 1.2],
      rotation: [0, 0, 0],
      scale: 2.1,
    },
    {
      requestKey: "a613e1ec-0510-4d68-8c7d-a2f619377dbc",
      position: [-scene.room.width / 2 + 0.45, 0, 0.75],
      rotation: [0, Math.PI / 2, 0],
      scale: 1.5,
    },
  ];
  const added: string[] = [];
  let adjustedInitialPlacement = false;
  for (const plan of plans) {
    const job = await Job.findOne({
      ownerId,
      projectId,
      requestKey: plan.requestKey,
      state: "ready",
    });
    if (!job?.assetId) continue;
    const asset = await Asset.findOne({
      _id: job.assetId,
      ownerId,
      status: "ready",
    });
    if (!asset) continue;
    const existing = scene.objects.find((o) => o.assetId === String(asset._id));
    if (existing) {
      // Adjust only this command's initial bed position, preserving later user edits.
      if (
        plan.requestKey === plans[0].requestKey &&
        JSON.stringify(existing.position) === JSON.stringify([-0.65, 0, -0.7])
      ) {
        existing.position = plan.position as [number, number, number];
        adjustedInitialPlacement = true;
      }
      continue;
    }
    scene.objects.push({
      instanceId: crypto.randomUUID(),
      assetId: String(asset._id),
      position: plan.position as [number, number, number],
      rotation: plan.rotation as [number, number, number],
      scale: [plan.scale, plan.scale, plan.scale],
    });
    added.push(String(asset._id));
  }
  if (!added.length && !adjustedInitialPlacement) {
    console.log("No ready furnishing is missing; project unchanged.");
  } else {
    if (!scene.room.wallpaper || scene.room.wallpaper === "none")
      scene.room = {
        ...scene.room,
        wallpaper: "linen",
        wallpaperWall: "back",
        wallpaperColor: "#8b9a7a",
      };
    const result = await projectItem(
      new Request("http://localhost/api/projects/" + projectId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: project.revision, scene }),
      }),
      projectId,
      { id: ownerId },
    );
    console.log(
      JSON.stringify({
        projectId,
        added,
        adjustedInitialPlacement,
        revision: result.revision,
        wallpaper: scene.room.wallpaper,
      }),
    );
  }
} catch (error) {
  console.error(
    "Placement paused:",
    error instanceof Error ? error.name : "Unknown",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
