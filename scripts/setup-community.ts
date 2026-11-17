// Explicit operator command: publish the user's authorized real room; never creates votes.
import mongoose from "mongoose";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { db } from "../src/server/db";
import {
  Asset,
  Challenge,
  Project,
  Publication,
  Submission,
} from "../src/server/models";
import { allowAssetRemix } from "../src/server/assets";
import { challenges, submissions } from "../src/server/challenges";
import {
  projectCollection,
  projectItem,
  publish,
} from "../src/server/projects";
const [email, projectId, permission, adminPermission] = process.argv.slice(2);
if (
  !email ||
  !mongoose.isValidObjectId(projectId) ||
  permission !== "--publish-and-allow-remix" ||
  adminPermission !== "--bootstrap-admin"
)
  throw new Error(
    "Explicit usage: setup-community.ts EMAIL PROJECT_ID --publish-and-allow-remix --bootstrap-admin",
  );
function request(data: unknown, method = "POST") {
  return new Request("http://localhost/operator", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
}
try {
  const connection = await db();
  const native = connection.connection.db!;
  const account = await native
    .collection("user")
    .findOne({ email: email.toLowerCase() });
  assert(account, "Register the real account first.");
  const user = {
    id: String(account._id),
    name: String(account.name),
    role: "admin",
  };
  const original = await Project.findOne({
    _id: projectId,
    ownerId: user.id,
    deletedAt: null,
  }).lean();
  assert(original, "Owned source bedroom is required.");
  const evidenceDirectory = `artifacts/community-live/${projectId}`;
  const evidence = JSON.parse(
    await readFile(`${evidenceDirectory}/verification.json`, "utf8"),
  );
  assert(
    evidence.journey.allAccountsAndVotesIsolated &&
      evidence.journey.finalTotals,
    "Complete the isolated live-storage checks first.",
  );
  assert.deepEqual(
    original.scene,
    evidence.sourceScene,
    "Source room changed: recapture the cover before publishing.",
  );
  const cover =
    "data:image/png;base64," +
    (await readFile(`${evidenceDirectory}/captured-cover.png`)).toString(
      "base64",
    );
  const assetIds = [...new Set(original.scene.objects.map((o) => o.assetId))];
  const owned = await Asset.find({
    _id: { $in: assetIds },
    ownerId: user.id,
    status: "ready",
    source: "Lux3D API",
  }).lean();
  assert.equal(
    owned.length,
    assetIds.length,
    "Only the real owner's ready Lux3D models may be enabled by this command.",
  );
  await native
    .collection("user")
    .updateOne({ _id: account._id }, { $set: { role: "admin" } });
  for (const asset of owned)
    await allowAssetRemix(
      request({ rightsConfirmed: true }),
      String(asset._id),
      user,
    );
  const title = "Small Space, Big Ideas";
  let challenge = await Challenge.findOne({ title, createdBy: user.id }).lean();
  if (!challenge) {
    const created = await challenges(
      request({
        title,
        theme: "Make one shared starting room feel like home.",
        rules:
          "Open to every signed-in Buildo account. Start from the pinned room, furnish and style it, then publish and submit one immutable snapshot. Room dimensions and starting finishes must remain unchanged. Use only assets you have permission to publish. One entry per account; no self-votes. Voting opens after submissions close. Ties use earliest submission, then entry ID.",
        room: original.scene.room,
        opensAt: new Date(Date.now() - 60000).toISOString(),
        submissionsCloseAt: "2026-11-18T17:00:00.000Z",
        votingCloseAt: "2026-11-19T09:00:00.000Z",
        status: "active",
      }),
      undefined,
      user,
    );
    challenge = (await Challenge.findById(created.id).lean())!;
  }
  assert(
    challenge && challenge.status === "active",
    "Expected an active challenge.",
  );
  let entry = await Project.findOne({
    ownerId: user.id,
    challengeId: String(challenge._id),
    brief: `Authorized bedroom entry copied from ${projectId}.`,
  }).lean();
  if (!entry) {
    const created = await projectCollection(
      request({
        title: original.title + " · Small Space entry",
        category: original.category,
        brief: `Authorized bedroom entry copied from ${projectId}.`,
        scene: original.scene,
        challengeId: String(challenge._id),
      }),
      user,
    );
    if (!("id" in created)) throw new Error("Project creation failed.");
    await projectItem(
      request({ revision: 0, scene: original.scene }, "PATCH"),
      String(created.id),
      user,
    );
    entry = (await Project.findById(created.id).lean())!;
  }
  let publication = await Publication.findOne({
    projectId: String(entry!._id),
    ownerId: user.id,
  }).lean();
  if (!publication) {
    const created = await publish(
      request({
        revision: entry!.revision,
        description:
          "A bedroom arranged with three genuine Lux3D-generated furniture models: an oak bedside table, a bed and frame, and a television console. Linen wallpaper and an evening lighting preset complete the room. Remix this snapshot to try your own arrangement.",
        allowRemix: true,
        cover,
      }),
      String(entry!._id),
      user,
    );
    publication = (await Publication.findById(created.id).lean())!;
  }
  let submission = await Submission.findOne({
    challengeId: String(challenge._id),
    ownerId: user.id,
  }).lean();
  if (!submission) {
    const created = await submissions(
      request({ publicationId: String(publication!._id) }),
      String(challenge._id),
      user,
    );
    if (!("id" in created)) throw new Error("Submission failed.");
    submission = (await Submission.findById(created.id).lean())!;
  }
  const result = {
    sourceProjectId: projectId,
    sourceRevision: original.revision,
    originalSceneUnchanged: true,
    challengeId: String(challenge._id),
    projectId: String(entry!._id),
    publicationId: String(publication!._id),
    submissionId: String(submission!._id),
    cover: publication!.cover,
    allowRemix: publication!.allowRemix,
    generatedModelTaskIds: owned.map((a) => a.taskId),
    submissionsCloseAt: challenge.submissionsCloseAt,
    votingCloseAt: challenge.votingCloseAt,
    participation: "Any authenticated account; no allowlist.",
    votesCreated: 0,
    testAccountsCreated: 0,
    checkedAt: new Date().toISOString(),
  };
  await mkdir("artifacts/live-community", { recursive: true });
  await writeFile(
    "artifacts/live-community/setup.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await mongoose.disconnect();
}
