// Real-account integration check. Run only with explicit authorization for one paid generation.
// A fresh visible browser is used; the user signs in manually. No password/session-token storage.
import { chromium, expect } from "@playwright/test";
import { MongoClient } from "mongodb";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
const email = process.argv[2];
if (!email)
  throw new Error(
    "Usage: node --env-file=.env.local scripts/live-bedroom-check.mjs account@example.com [--generate-once]",
  );
const origin = new URL(process.env.BETTER_AUTH_URL).origin;
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname))
  throw new Error(
    "Run this local check against a localhost application origin.",
  );
const directory = "artifacts/live-bedroom";
await mkdir(directory, { recursive: true });
const stateFile = `${directory}/state.json`;
let state;
try {
  state = JSON.parse(await readFile(stateFile, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  state = { requestKey: randomUUID() };
}
async function persist() {
  await writeFile(stateFile, JSON.stringify(state, null, 2));
}
const mongo = await MongoClient.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 8000,
});
const expected = await mongo
  .db()
  .collection("user")
  .findOne({ email: email.toLowerCase() }, { projection: { _id: 1 } });
await mongo.close();
if (!expected) throw new Error("Register the intended account first.");
const browser = await chromium.launch({
  headless: false,
  executablePath:
    process.env.BUILDO_CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--enable-webgl"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.name));
async function request(path, data, method = data ? "POST" : "GET") {
  const r = await context.request.fetch(`${origin}/api/${path}`, {
    method,
    headers: { Origin: origin },
    ...(data ? { data } : {}),
  });
  const result = await r.json();
  if (!r.ok())
    throw new Error(
      `${result.error?.code || "REQUEST"}: ${result.error?.message || "Request failed"}`,
    );
  return result;
}
console.log(
  "Visible test browser opened. Sign in manually using the intended account.",
);
console.log(
  "Google may block automated browsers. In that case close this browser and use the manual procedure in docs/DEMO_WALKTHROUGH.md in a regular browser. Sessions are not shared.",
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await browser.close();
    process.exit(0);
  });
}
await page.goto(`${origin}/login?next=%2Fdashboard`);
let signedIn = false;
while (!signedIn) {
  if (!browser.isConnected()) process.exit(0);
  try {
    const me = await request("me");
    if (me.id !== String(expected._id)) throw new Error("WRONG_ACCOUNT");
    signedIn = true;
  } catch (e) {
    if (e.message === "WRONG_ACCOUNT") {
      console.log(
        "The browser is signed into a different account. Sign out and use the intended account.",
      );
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}
console.log("PASS authenticated as the intended existing account.");
try {
  if (state.accountId && state.accountId !== String(expected._id))
    throw new Error(
      "Stored check belongs to another account. Use a separate artifact directory.",
    );
  state.accountId = String(expected._id);
  await persist();
  if (!state.projectId) {
    await page.goto(`${origin}/projects/new`);
    await page
      .getByLabel("Give your space a name")
      .fill("Bedroom — live integration check");
    await page.getByLabel("Category", { exact: true }).selectOption("bedroom");
    await page
      .getByLabel("Your starting idea", { exact: false })
      .fill(
        "A calm bedroom with warm oak furniture. Private live integration verification.",
      );
    await page.getByRole("button", { name: "Open the studio" }).click();
    await expect(page).toHaveURL(/\/studio\//);
    state.projectId = new URL(page.url()).pathname.split("/").pop();
    await persist();
    console.log("PASS private bedroom project created.");
  } else await page.goto(`${origin}/studio/${state.projectId}`);
  if (!state.jobId) {
    if (state.submissionStarted) {
      const jobs = await request("generations");
      const existing = jobs.items.find(
        (j) => j.requestKey === state.requestKey,
      );
      if (!existing)
        throw new Error(
          "Submission is uncertain. Check the provider account; this script will not resubmit.",
        );
      state.jobId = existing.id;
      await persist();
    } else {
      if (!process.argv.includes("--generate-once"))
        throw new Error(
          "Generation requires --generate-once and explicit user authorization.",
        );
      state.submissionStarted = true;
      await persist();
      const job = await request("generations", {
        projectId: state.projectId,
        prompt:
          "A contemporary oak bedside table with rounded corners and one drawer, isolated single furniture object",
        style: "photorealistic",
        requestKey: state.requestKey,
        allowReuse: false,
      });
      state.jobId = job.id;
      await persist();
      console.log(
        "ONE authorized generation submitted. No automatic resubmission.",
      );
    }
  }
  let ready = false;
  let previous = "";
  while (!ready) {
    const job = await request(`generations/${state.jobId}`);
    if (job.state !== previous) {
      state.jobState = job.state;
      state.providerTaskId = job.providerTaskId;
      state.outputHost = job.outputHost;
      await persist();
      console.log(`Observed generation state: ${job.state}`);
      if (job.outputHost)
        console.log(`Observed provider output hostname: ${job.outputHost}`);
      previous = job.state;
    }
    if (job.state === "ready") {
      state.assetId = job.assetId;
      await persist();
      ready = true;
      break;
    }
    if (["unknown", "failed", "timed_out"].includes(job.state))
      throw new Error(
        job.safeError ||
          "Provider job needs review; no new generation will be submitted.",
      );
    if (job.state === "transfer_failed")
      console.log(
        "Transfer needs attention. Configure only the observed trusted output hostname, restart the app, and rerun this check to resume the same job.",
      );
    await new Promise((r) => setTimeout(r, 20000));
  }
  console.log(
    "PASS real generated asset stored and delivery verified by the server.",
  );
  await page.reload();
  await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
    timeout: 30000,
  });
  let current = await request(`projects/${state.projectId}`);
  if (!current.project.scene.objects.some((o) => o.assetId === state.assetId)) {
    const library = await request("assets");
    const asset = library.items.find((a) => a.id === state.assetId);
    if (!asset) throw new Error("Ready asset is not in the library.");
    await page
      .getByRole("button", { name: "+ " + asset.name, exact: true })
      .click();
  } else {
    const asset = await request("assets");
    const name = asset.items.find((a) => a.id === state.assetId)?.name;
    const action = page.getByRole("button", { name: "+ " + name, exact: true });
    if (!(await action.count()))
      throw new Error("Asset missing in browser library.");
    // Select saved object in the viewport is a human visual check; use current saved transform for resume verification.
  }
  const properties = page.locator(".numeric-grid");
  if (await properties.count()) {
    await properties.nth(0).getByLabel("X", { exact: true }).fill("1.1");
    await properties.nth(0).getByLabel("X", { exact: true }).blur();
    await properties.nth(1).getByLabel("Y", { exact: true }).fill("30");
    await properties.nth(1).getByLabel("Y", { exact: true }).blur();
    await properties.nth(2).getByLabel("X", { exact: true }).fill("0.8");
    await properties.nth(2).getByLabel("X", { exact: true }).blur();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByText("● Unsaved changes", { exact: false }),
    ).toHaveCount(0);
  }
  current = await request(`projects/${state.projectId}`);
  state.scene = current.project.scene;
  state.revision = current.project.revision;
  await persist();
  await page.screenshot({
    path: `${directory}/bedroom-before-refresh.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
    timeout: 30000,
  });
  const reopened = await request(`projects/${state.projectId}`);
  expect(reopened.project.scene).toEqual(state.scene);
  await page.screenshot({
    path: `${directory}/bedroom-after-refresh.png`,
    fullPage: true,
  });
  state.restoredExactly = true;
  state.pageErrorTypes = pageErrors;
  state.completedAt = new Date().toISOString();
  await persist();
  console.log("PASS exact scene restored after hard reload.");
  console.log(
    "Private bedroom remains open for visual inspection. No publication or external post was created.",
  );
  console.log(
    "Inspect real textures, orientation, bounds and scale in this browser. Close the browser when finished.",
  );
  await new Promise((resolve) => browser.on("disconnected", resolve));
} catch (e) {
  console.log("Live check paused:", e.message.split("\n")[0]);
  console.log(
    "The private project and persisted job are retained. The browser stays open for review. No new generation is submitted on resume.",
  );
  await new Promise((resolve) => browser.on("disconnected", resolve));
}
