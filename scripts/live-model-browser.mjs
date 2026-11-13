// Genuine existing Cloudinary model, disposable accounts/projects/database. No provider create calls.
import { chromium, expect } from "@playwright/test";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId } from "mongodb";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const [email, assetId] = process.argv.slice(2);
if (!email || !ObjectId.isValid(assetId || ""))
  throw new Error("Provide account email and existing asset ID.");
const source = await MongoClient.connect(process.env.MONGODB_URI);
let asset;
try {
  const user = await source
    .db()
    .collection("user")
    .findOne({ email: email.toLowerCase() }, { projection: { _id: 1 } });
  asset =
    user &&
    (await source
      .db()
      .collection("assets")
      .findOne({
        _id: new ObjectId(assetId),
        ownerId: String(user._id),
        status: "ready",
      }));
  if (
    !asset ||
    asset.source !== "Lux3D API" ||
    !asset.secureUrl.startsWith("https://res.cloudinary.com/")
  )
    throw new Error("Owned, ready Lux3D asset not found.");
} finally {
  await source.close();
}

const origin = "http://localhost:3102";
const mongo = await MongoMemoryServer.create({
  instance: { dbName: `buildo_live_model_test_${Date.now()}` },
});
const client = await MongoClient.connect(mongo.getUri());
const app = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", "3102"],
  {
    env: {
      ...process.env,
      MONGODB_URI: mongo.getUri(),
      BETTER_AUTH_URL: origin,
      BETTER_AUTH_SECRET: randomBytes(40).toString("hex"),
      SITE_URL: origin,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      LUX3D_API_KEY: "",
      CLOUDINARY_CLOUD_NAME: "",
      CLOUDINARY_API_KEY: "",
      CLOUDINARY_API_SECRET: "",
    },
    stdio: "ignore",
  },
);
let browser;
let page;
let stage = "server startup";
const directory = "artifacts/live-model-browser";
await mkdir(directory, { recursive: true });
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    if (i === 59) throw new Error("Server startup timed out.");
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
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.name));
  stage = "isolated account";
  const password = `Isolated-Test-${randomBytes(20).toString("hex")}!`;
  const signup = await page.request.post(`${origin}/api/auth/sign-up/email`, {
    headers: { Origin: origin },
    data: {
      name: "TEST ONLY Live Model",
      email: "live-model@test.example",
      password,
    },
  });
  expect(signup.ok()).toBe(true);
  const me = await (await page.request.get(`${origin}/api/me`)).json();
  const copyId = new ObjectId();
  await client
    .db()
    .collection("assets")
    .insertOne({
      ...asset,
      _id: copyId,
      ownerId: me.id,
      name: "TEST ONLY · genuine Lux3D bedside table",
      allowReuse: false,
      rightsConfirmed: false,
      generationId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  stage = "private test room";
  await page.goto(`${origin}/projects/new`);
  await page
    .getByLabel("Give your space a name")
    .fill("TEST ONLY — genuine Lux3D bedroom");
  await page
    .getByRole("combobox", { name: /^Category/ })
    .selectOption("bedroom");
  await page.getByRole("button", { name: "Open the studio" }).click();
  await expect(page).toHaveURL(/\/studio\//);
  const projectId = new URL(page.url()).pathname.split("/").pop();
  stage = "real Cloudinary browser delivery";
  const delivered = page.waitForResponse((r) => r.url() === asset.secureUrl, {
    timeout: 60000,
  });
  await page
    .getByRole("button", {
      name: "+ TEST ONLY · genuine Lux3D bedside table",
      exact: true,
    })
    .click();
  const response = await delivered;
  expect(response.ok()).toBe(true);
  const headers = response.headers();
  expect(headers["access-control-allow-origin"]).toBe("*");
  await response.finished();
  await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle");
  stage = "transform and save";
  const numeric = page.locator(".numeric-grid");
  for (const [group, axis, value] of [
    [0, "X", "1.1"],
    [1, "Y", "30"],
    [2, "X", "0.8"],
  ]) {
    await numeric.nth(group).getByLabel(axis, { exact: true }).fill(value);
    await numeric.nth(group).getByLabel(axis, { exact: true }).blur();
  }
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByText("● Unsaved changes", { exact: false }),
  ).toHaveCount(0);
  const saved = await (
    await page.request.get(`${origin}/api/projects/${projectId}`)
  ).json();
  expect(saved.project.scene.objects[0].position[0]).toBe(1.1);
  expect(saved.project.scene.objects[0].rotation[1]).toBeCloseTo(Math.PI / 6);
  expect(saved.project.scene.objects[0].scale).toEqual([0.8, 0.8, 0.8]);
  await mkdir(directory, { recursive: true });
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.screenshot({
    path: `${directory}/genuine-table-preview.png`,
    fullPage: true,
  });
  stage = "reload restoration";
  await page.reload();
  await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle");
  const reopened = await (
    await page.request.get(`${origin}/api/projects/${projectId}`)
  ).json();
  expect(reopened.project.scene).toEqual(saved.project.scene);
  await expect(
    page.getByText("A model is unavailable.", { exact: false }),
  ).toHaveCount(0);
  await page.screenshot({
    path: `${directory}/genuine-table-restored.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
  const report = {
    sourceAssetId: assetId,
    providerTaskId: asset.taskId,
    source: asset.source,
    cloudinaryDelivery: {
      status: response.status(),
      contentType: headers["content-type"],
      cors: headers["access-control-allow-origin"],
      bytes: asset.bytes,
      sha256: asset.sha256,
    },
    scene: saved.project.scene,
    revision: saved.project.revision,
    restoredExactly: true,
    privateTestDatabaseOnly: true,
    productionBedroomUnchanged: true,
    pageErrors: errors,
    checkedAt: new Date().toISOString(),
  };
  await writeFile(
    `${directory}/verification.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(
    "PASS genuine Lux3D GLB delivered directly by Cloudinary with browser CORS.",
  );
  console.log(
    "PASS numeric move, rotate, uniform resize, MongoDB save and exact scene restoration after reload.",
  );
  console.log(
    "PASS no uncaught browser errors. Inspect screenshots for texture/orientation evidence.",
  );
  console.log(
    "Disposable test scene only; real user's bedroom unchanged. No generation or publication created.",
  );
} catch (error) {
  console.error(`Live-model browser check failed at ${stage}: ${error.name}`);
  console.error(error.message.split("\n")[0]);
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
