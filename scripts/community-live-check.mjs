import { verifyCommunityJourney } from "./verify-community-journey.mjs";
// Read an authorized real scene, then render a private copy in disposable MongoDB.
// Production database is read-only; live Cloudinary cover uploads and isolated TEST ONLY publications are explicit. No paid generations.
import { chromium, expect } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const [email, projectId] = process.argv.slice(2);
if (!email || !ObjectId.isValid(projectId || ""))
  throw new Error("Provide account email and authorized project ID.");
const real = await MongoClient.connect(process.env.MONGODB_URI);
let sourceProject, sourceAssets;
try {
  const user = await real
    .db()
    .collection("user")
    .findOne({ email: email.toLowerCase() }, { projection: { _id: 1 } });
  sourceProject =
    user &&
    (await real
      .db()
      .collection("projects")
      .findOne({
        _id: new ObjectId(projectId),
        ownerId: String(user._id),
        deletedAt: null,
      }));
  if (!sourceProject) throw new Error("Owned project not found.");
  const ids = [...new Set(sourceProject.scene.objects.map((o) => o.assetId))];
  sourceAssets = await real
    .db()
    .collection("assets")
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) }, status: "ready" })
    .toArray();
  if (sourceAssets.length !== ids.length || !ids.length)
    throw new Error("Referenced ready models required.");
} finally {
  await real.close();
}
const origin = "http://localhost:3106";
const directory = `artifacts/community-live/${projectId}`;
await mkdir(directory, { recursive: true });
const mongo = await MongoMemoryServer.create({
  instance: { dbName: `buildo_actual_scene_test_${Date.now()}` },
});
const client = await MongoClient.connect(mongo.getUri());
const app = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", "3106"],
  {
    env: {
      ...process.env,
      MONGODB_URI: mongo.getUri(),
      BETTER_AUTH_URL: origin,
      SITE_URL: origin,
      BETTER_AUTH_SECRET: randomBytes(40).toString("hex"),
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      LUX3D_API_KEY: "",
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    },
    stdio: "ignore",
  },
);
let browser, page;
let stage = "startup";
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    if (i === 59) throw new Error("Startup timed out");
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch({
    executablePath:
      process.env.BUILDO_CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: [
      "--enable-webgl",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  page = await browser.newPage({
    viewport: { width: 1680, height: 1100 },
    colorScheme: "light",
  });
  const errors = [];
  page.on("pageerror", (e) =>
    errors.push({ name: e.name, message: e.message.split("\n")[0] }),
  );
  stage = "isolated signup";
  const signup = await page.request.post(`${origin}/api/auth/sign-up/email`, {
    headers: { Origin: origin },
    data: {
      name: "TEST ONLY actual bedroom",
      email: "bedroom@verification.example",
      password: `Isolated-${randomBytes(20).toString("hex")}!A`,
    },
  });
  expect(signup.ok()).toBe(true);
  const me = await (await page.request.get(`${origin}/api/me`)).json();
  const mapping = new Map();
  for (const asset of sourceAssets) {
    const metadata = { ...asset };
    delete metadata.generationId;
    const id = new ObjectId();
    mapping.set(String(asset._id), String(id));
    await client
      .db()
      .collection("assets")
      .insertOne({
        ...metadata,
        _id: id,
        ownerId: me.id,
        name: `TEST ONLY · ${asset.name}`,
        allowReuse: false,
        rightsConfirmed: false,
      });
  }
  const scene = structuredClone(sourceProject.scene);
  scene.objects = scene.objects.map((o) => ({
    ...o,
    assetId: mapping.get(o.assetId),
  }));
  stage = "isolated scene creation";
  const created = await page.request.post(`${origin}/api/projects`, {
    headers: { Origin: origin },
    data: {
      title: "TEST ONLY — actual bedroom layout",
      category: "bedroom",
      brief:
        "Genuine existing models, real layout copied read-only into an isolated verification database.",
      scene,
    },
  });
  expect(created.ok()).toBe(true);
  const project = await created.json();
  stage = "actual model parsing";
  await page.goto(`${origin}/studio/${project.id}`);
  for (const id of mapping.values())
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-loaded-models",
      new RegExp(id),
      { timeout: 90000 },
    );
  await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.screenshot({
    path: `${directory}/bedroom-light.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await page.screenshot({
    path: `${directory}/bedroom-dark.png`,
    fullPage: true,
    animations: "disabled",
  });
  stage = "reload restoration";
  await page.reload();
  for (const id of mapping.values())
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-loaded-models",
      new RegExp(id),
      { timeout: 90000 },
    );
  const restored = await (
    await page.request.get(`${origin}/api/projects/${project.id}`)
  ).json();
  expect(restored.project.scene).toEqual(scene);
  expect(errors).toEqual([]);
  stage = "recovery and community journey";
  const journey = await verifyCommunityJourney({
    page,
    browser,
    client,
    origin,
    project,
    scene,
    sourceAssets,
    mapping,
    directory,
    testMongoUri: mongo.getUri(),
  });
  const report = {
    journey,
    sourceProjectId: projectId,
    sourceRevision: sourceProject.revision,
    sourceScene: sourceProject.scene,
    assets: sourceAssets.map((a) => ({
      id: String(a._id),
      taskId: a.taskId,
      bytes: a.bytes,
      sha256: a.sha256,
      bounds: a.bounds,
      normalization: a.normalization,
    })),
    restoredExactly: true,
    productionWrites: false,
    privateDisposableScene: true,
    pageErrors: errors,
    checkedAt: new Date().toISOString(),
  };
  await writeFile(
    `${directory}/verification.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(
    `PASS ${sourceAssets.length} genuine Cloudinary models in the actual bedroom layout, wallpaper, light/dark and exact reload restoration.`,
  );
  console.log(
    "Original room read-only; test scene/account/database disposable. Inspect actual screenshots for composition.",
  );
} catch (e) {
  console.error(`Bedroom scene check failed at ${stage}: ${e.name}`);
  console.error(e.message.split("\n")[0]);
  await page
    ?.screenshot({ path: `${directory}/failure.png`, fullPage: true })
    .catch(() => {});
  process.exitCode = 1;
} finally {
  await browser?.close();
  app.kill("SIGTERM");
  await client.close();
  await mongo.stop();
}
