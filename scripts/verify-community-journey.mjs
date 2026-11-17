import { expect } from "@playwright/test";
import { ObjectId } from "mongodb";
import { randomBytes, createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

export async function verifyCommunityJourney({
  page,
  browser,
  client,
  origin,
  project,
  scene,
  sourceAssets,
  mapping,
  directory,
  testMongoUri,
}) {
  async function api(actor, path, data, method = data ? "POST" : "GET") {
    const r = await actor.request.fetch(`${origin}/api/${path}`, {
      method,
      headers: { Origin: origin },
      ...(data ? { data } : {}),
    });
    const result = await r.json();
    expect(r.ok(), `${path}: ${result.error?.code || r.status()}`).toBe(true);
    return result;
  }
  const me = await api(page, "me");
  // A deliberately simulated interrupted job, but delivery is the actual Cloudinary GLB.
  const asset = sourceAssets[0];
  const checkpoint = Object.fromEntries(
    [
      "secureUrl",
      "publicId",
      "resourceType",
      "format",
      "bytes",
      "sha256",
      "vertices",
      "texturePixels",
      "bounds",
      "normalization",
    ].map((k) => [k, asset[k]]),
  );
  const job = new ObjectId();
  await client
    .db()
    .collection("generationjobs")
    .insertOne({
      _id: job,
      ownerId: me.id,
      projectId: project.id,
      prompt: "TEST ONLY interrupted delivery of genuine existing model",
      state: "transfer_failed",
      providerTaskId: asset.taskId,
      requestKey: crypto.randomUUID(),
      transferAttempts: 8,
      recoveryFailures: 8,
      transferCheckpoint: checkpoint,
      failure: {
        retryable: false,
        code: "TIMEOUT",
        reference: "test-only-interruption",
      },
      safeError:
        "TEST ONLY interrupted delivery; existing Cloudinary file retained.",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  await page.goto(`${origin}/studio/${project.id}`);
  await page
    .getByRole("button", { name: "Retry delivery", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await client.db().collection("generationjobs").findOne({ _id: job }))
          ?.state,
      { timeout: 90000 },
    )
    .toBe("ready");
  expect(
    (await api(page, `generations/${job}`)).transferCheckpoint,
  ).toBeUndefined();
  console.log(
    "PASS browser Retry delivery restores retained real Cloudinary model without a provider create call.",
  );
  // Exercise the real CLI scheduler with no open studio tab and no provider key.
  await page.goto(`${origin}/settings`);
  const offlineJob = new ObjectId();
  await client
    .db()
    .collection("generationjobs")
    .insertOne({
      _id: offlineJob,
      ownerId: me.id,
      projectId: project.id,
      prompt: "TEST ONLY tab-closed recovery",
      state: "transferring",
      providerTaskId: "TEST-ONLY-CHECKPOINT-NO-PROVIDER-CALL",
      requestKey: crypto.randomUUID(),
      transferCheckpoint: checkpoint,
      stage: "verify_delivery",
      createdAt: new Date(),
      updatedAt: new Date(),
      leaseUntil: new Date(Date.now() - 1000),
    });
  await new Promise((resolve, reject) => {
    const worker = spawn(
      process.execPath,
      [
        "--conditions=react-server",
        "--import",
        "tsx",
        "scripts/reconcile-generations.ts",
      ],
      {
        env: { ...process.env, MONGODB_URI: testMongoUri, LUX3D_API_KEY: "" },
        stdio: "ignore",
      },
    );
    worker.on("error", reject);
    worker.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Scheduler CLI failed")),
    );
  });
  expect(
    (
      await client
        .db()
        .collection("generationjobs")
        .findOne({ _id: offlineJob })
    ).state,
  ).toBe("ready");
  console.log("PASS scheduled CLI recovers expired lease with studio closed.");
  await page.goto(`${origin}/assets`);
  for (const a of sourceAssets) {
    const card = page.locator(".card").filter({
      has: page.getByRole("heading", {
        name: `TEST ONLY · ${a.name}`,
        exact: true,
      }),
    });
    await card.getByRole("checkbox").check();
    await card
      .getByRole("button", { name: "Allow remix reuse", exact: true })
      .click();
    await expect(
      card.getByText("Remix reuse permitted", { exact: true }),
    ).toBeVisible();
  }
  await page.goto(`${origin}/studio/${project.id}`);
  for (const id of mapping.values())
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-loaded-models",
      new RegExp(id),
      { timeout: 90000 },
    );
  await page.getByRole("button", { name: "Share / Publish" }).click();
  await page
    .getByRole("button", { name: "Capture current view as cover" })
    .click();
  await expect(
    page.getByText("Viewport cover captured.", { exact: false }),
  ).toBeVisible();
  const coverData = await page
    .getByAltText("Captured room cover")
    .getAttribute("src");
  await writeFile(
    `${directory}/captured-cover.png`,
    Buffer.from(coverData.split(",")[1], "base64"),
  );
  await page
    .getByLabel("Tell the story of your space")
    .fill(
      "TEST ONLY isolated live-storage sharing verification, genuine existing Lux3D furniture.",
    );
  await page.getByRole("checkbox", { name: /Allow others to remix/ }).check();
  const publishedResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/api/projects/${project.id}/publish`) &&
      r.request().method() === "POST",
    { timeout: 90000 },
  );
  await page
    .getByRole("button", { name: "Publish snapshot", exact: true })
    .click();
  const publishResult = await publishedResponse;
  expect(publishResult.ok()).toBe(true);
  const publication = await publishResult.json();
  const delivered = await page.request.get(publication.cover);
  expect(delivered.ok()).toBe(true);
  const coverBytes = await delivered.body();
  expect(coverBytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  const current = await api(page, `projects/${project.id}`);
  await api(
    page,
    `projects/${project.id}`,
    {
      revision: current.project.revision,
      scene: { ...scene, lighting: "warm" },
    },
    "PATCH",
  );
  expect((await api(page, `designs/${publication.id}`)).design.scene).toEqual(
    scene,
  );
  console.log(
    "PASS real viewport cover uploaded to Cloudinary; published snapshot remains immutable after draft edit.",
  );
  await page.goto(`${origin}/settings`);
  const secondContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const second = await secondContext.newPage();
  const secondErrors = [];
  second.on("pageerror", (error) => secondErrors.push(error.name));
  async function modelsRendered() {
    for (const id of mapping.values())
      await expect(second.locator("canvas")).toHaveAttribute(
        "data-loaded-models",
        new RegExp(id),
        { timeout: 90000 },
      );
    await expect(second.locator('canvas[data-rendered="true"]')).toBeVisible({
      timeout: 30000,
    });
  }
  const signup = await second.request.post(`${origin}/api/auth/sign-up/email`, {
    headers: { Origin: origin },
    data: {
      name: "TEST ONLY second participant",
      email: "participant@isolated.example",
      password: `Verified-${randomBytes(20).toString("hex")}!A`,
    },
  });
  expect(signup.ok()).toBe(true);
  expect(
    (await second.request.get(`${origin}/api/projects/${project.id}`)).status(),
  ).toBe(404);
  await second.goto(`${origin}/designs/${publication.id}`);
  await modelsRendered();
  await second.getByRole("button", { name: /Remix this space/ }).click();
  await expect(second).toHaveURL(/\/studio\//);
  const remix = await api(second, `projects/${second.url().split("/").pop()}`);
  expect(remix.project.originalId).toBe(publication.id);
  expect(remix.project.scene.objects).toHaveLength(scene.objects.length);
  await modelsRendered();
  expect(secondErrors).toEqual([]);
  await second.screenshot({
    timeout: 90000,
    animations: "disabled",
    path: `${directory}/second-account-remix.png`,
    fullPage: true,
  });
  await client
    .db()
    .collection("user")
    .updateOne({ _id: new ObjectId(me.id) }, { $set: { role: "admin" } });
  const now = Date.now();
  const challenge = await api(page, "challenges", {
    title: "TEST ONLY live-storage challenge",
    theme: "Explicit isolated verification",
    rules:
      "TEST ONLY. Same pinned starting room; no public community activity is created.",
    room: scene.room,
    opensAt: new Date(now - 60000).toISOString(),
    submissionsCloseAt: new Date(now + 600000).toISOString(),
    votingCloseAt: new Date(now + 1200000).toISOString(),
    status: "active",
  });
  const entryProject = await api(page, "projects", {
    title: "TEST ONLY genuine-room entry",
    category: "bedroom",
    scene,
    challengeId: challenge.id,
  });
  await api(
    page,
    `projects/${entryProject.id}`,
    { revision: 0, scene },
    "PATCH",
  );
  const entryPublication = await api(
    page,
    `projects/${entryProject.id}/publish`,
    { revision: 1, description: "TEST ONLY entry", allowRemix: true },
  );
  const submission = await api(page, `challenges/${challenge.id}/submissions`, {
    publicationId: entryPublication.id,
  });
  expect(
    (
      await page.request.post(
        `${origin}/api/challenges/${challenge.id}/votes`,
        { headers: { Origin: origin }, data: { submissionId: submission.id } },
      )
    ).status(),
  ).toBe(409);
  await client
    .db()
    .collection("challenges")
    .updateOne(
      { _id: new ObjectId(challenge.id) },
      { $set: { submissionsCloseAt: new Date(Date.now() - 1000) } },
    );
  await second.goto(`${origin}/challenges/${challenge.id}`);
  await second.getByRole("button", { name: "Vote", exact: true }).click();
  await expect(
    second.getByRole("button", { name: "Withdraw vote", exact: true }),
  ).toBeVisible();
  await second
    .getByRole("button", { name: "Withdraw vote", exact: true })
    .click();
  await expect(
    second.getByRole("button", { name: "Vote", exact: true }),
  ).toBeVisible();
  await api(second, `challenges/${challenge.id}/votes`, {
    submissionId: submission.id,
  });
  expect(
    (
      await page.request.post(
        `${origin}/api/challenges/${challenge.id}/votes`,
        { headers: { Origin: origin }, data: { submissionId: submission.id } },
      )
    ).status(),
  ).toBe(403);
  await client
    .db()
    .collection("challenges")
    .updateOne(
      { _id: new ObjectId(challenge.id) },
      { $set: { votingCloseAt: new Date(Date.now() - 1) } },
    );
  const final = await api(second, `challenges/${challenge.id}/submissions`);
  expect(final.resultsFinal).toBe(true);
  expect(final.items[0].votes).toBe(1);
  expect(
    (
      await second.request.post(
        `${origin}/api/challenges/${challenge.id}/votes`,
        { headers: { Origin: origin }, data: { submissionId: submission.id } },
      )
    ).status(),
  ).toBe(409);
  await second.goto(`${origin}/challenges/${challenge.id}`);
  await second.screenshot({
    timeout: 90000,
    animations: "disabled",
    path: `${directory}/isolated-final-results.png`,
    fullPage: true,
  });
  await secondContext.close();
  console.log(
    "PASS genuine models: second-account explore/remix, pinned entry, vote/withdraw, no self-vote and closed final totals. All participants/votes are isolated test records.",
  );
  return {
    publicationId: publication.id,
    cover: publication.cover,
    coverSha256: createHash("sha256").update(coverBytes).digest("hex"),
    coverHttpStatus: delivered.status(),
    browserRecovery: true,
    unattendedRecovery: true,
    remix: true,
    challengeWindows: true,
    votingAndWithdrawal: true,
    finalTotals: true,
    allAccountsAndVotesIsolated: true,
  };
}
