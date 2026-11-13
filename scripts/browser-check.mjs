// Disposable TEST ONLY database and local mesh fixture. No provider calls or production data.
import { chromium, expect } from "@playwright/test";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId } from "mongodb";
import { Document, NodeIO } from "@gltf-transform/core";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
const origin = "http://localhost:3100";
const mongo = await MongoMemoryServer.create({
  instance: { dbName: `buildo_browser_test_${Date.now()}` },
});
const client = await MongoClient.connect(mongo.getUri());
const database = client.db();
const app = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", "3100"],
  {
    env: {
      ...process.env,
      MONGODB_URI: mongo.getUri(),
      BETTER_AUTH_SECRET: randomBytes(40).toString("hex"),
      BETTER_AUTH_URL: origin,
      SITE_URL: "https://buildo-browser.example",
      GOOGLE_CLIENT_ID: "buildo-test-only.apps.googleusercontent.com",
      GOOGLE_CLIENT_SECRET: "buildo-test-only-not-a-real-secret",
      LUX3D_API_KEY: "",
      CLOUDINARY_CLOUD_NAME: "",
      CLOUDINARY_API_KEY: "",
      CLOUDINARY_API_SECRET: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverLog = "";
app.stdout.on("data", (d) => (serverLog += d));
app.stderr.on("data", (d) => (serverLog += d));
let browser;
const errors = [];
async function record(name, fn) {
  await fn();
  console.log(`PASS ${name}`);
}
async function req(page, path, data, method = "POST") {
  const r = await page.request.fetch(`${origin}/api/${path}`, {
    method,
    headers: { Origin: origin },
    data,
  });
  const json = await r.json();
  expect(r.ok(), JSON.stringify(json)).toBe(true);
  return json;
}
async function register(page, name, email, next = "/dashboard") {
  await page.goto(`${origin}/register?next=${encodeURIComponent(next)}`);
  await expect(
    page.getByRole("status", { name: "0 of 6 password checks passed" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeDisabled();
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Buildo-test-password-123");
  await expect(
    page.getByRole("status", { name: "5 of 6 password checks passed" }),
  ).toBeVisible();
  await page.getByLabel("Confirm password", { exact: true }).fill("mismatch");
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeDisabled();
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("Buildo-test-password-123");
  await expect(
    page.getByRole("status", { name: "6 of 6 password checks passed" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show confirm password", exact: true })
    .click();
  await expect(
    page.getByLabel("Confirm password", { exact: true }),
  ).toHaveAttribute("type", "text");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page
    .getByRole("button", { name: "Hide confirm password", exact: true })
    .click();
  await page.screenshot({
    path: "artifacts/browser/register-checklist.png",
    fullPage: true,
  });
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue(
    "Buildo-test-password-123",
  );
  await page
    .getByRole("button", { name: "Hide password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(`${origin}${next}`);
}
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    if (i === 59) throw new Error("Server startup timed out: " + serverLog);
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
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.stack || e.message));
  await mkdir("artifacts/browser", { recursive: true });
  await record(
    "landing renders real procedural room and public empty gallery",
    async () => {
      await page.goto(origin);
      await expect(page.locator("head link[rel=canonical]")).toHaveAttribute(
        "href",
        /^https?:\/\//,
      );
      await expect(
        page.locator('head meta[property="og:title"]'),
      ).toHaveAttribute("content", /Buildo/);
      await expect(
        page.locator('head meta[name="twitter:card"]'),
      ).toHaveAttribute("content", "summary_large_image");
      expect(
        await page
          .locator('script[type="application/ld+json"]')
          .first()
          .textContent(),
      ).toContain("WebSite");
      const image = await page.request.get(`${origin}/opengraph-image`);
      expect(image.ok()).toBe(true);
      expect(image.headers()["content-type"]).toContain("image/png");
      await expect(
        page.getByRole("heading", {
          name: "Your ideas. Your space. Built by you.",
        }),
      ).toBeVisible();
      await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
        timeout: 30000,
      });
      await page
        .getByRole("button", { name: "Blank canvas", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Blank canvas", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page
        .getByRole("button", { name: "Room study", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Preview Soft sage finish" })
        .click();
      await expect(
        page.getByRole("button", { name: "Preview Soft sage finish" }),
      ).toHaveAttribute("aria-pressed", "true");
      await page
        .getByRole("button", { name: "Preview Warm oak finish" })
        .click();
      await page.locator(".faq-item").first().locator("summary").click();
      await expect(
        page.getByText(
          "No. Start with a room, add an object, and move things around.",
          { exact: false },
        ),
      ).toBeVisible();
      await page.locator(".faq-item").first().locator("summary").click();
      await page.screenshot({
        path: "artifacts/browser/landing-desktop.png",
        fullPage: true,
      });
      await page.goto(`${origin}/explore`);
      await expect(
        page.getByText("Be the first to open a door."),
      ).toBeVisible();
    },
  );
  await record(
    "Google OAuth initiation uses state and the exact local callback (test credentials only)",
    async () => {
      await page.goto(`${origin}/login`);
      await expect(page.locator("head meta[name=robots]")).toHaveAttribute(
        "content",
        /noindex/,
      );
      const loginResponse = await page.request.get(`${origin}/login`);
      expect(loginResponse.headers()["x-robots-tag"]).toContain("noindex");
      await page
        .getByLabel("Password", { exact: true })
        .fill("test-login-visibility");
      await page
        .getByRole("button", { name: "Show password", exact: true })
        .click();
      await expect(
        page.getByLabel("Password", { exact: true }),
      ).toHaveAttribute("type", "text");
      await page
        .getByRole("button", { name: "Hide password", exact: true })
        .click();
      await expect(
        page.getByLabel("Password", { exact: true }),
      ).toHaveAttribute("type", "password");
      await expect(
        page.getByRole("button", { name: "Continue with Google" }),
      ).toBeEnabled();
      const result = await req(page, "auth/sign-in/social", {
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/login?error=google",
        disableRedirect: true,
      });
      const target = new URL(result.url);
      expect(target.hostname).toBe("accounts.google.com");
      expect(target.searchParams.get("client_id")).toBe(
        "buildo-test-only.apps.googleusercontent.com",
      );
      expect(target.searchParams.get("redirect_uri")).toBe(
        `${origin}/api/auth/callback/google`,
      );
      expect(target.searchParams.get("state")).toBeTruthy();
      expect(target.searchParams.get("response_type")).toBe("code");
      await page.goto(`${origin}/login?error=google`);
      await expect(page.locator(".notice[role=alert]")).toContainText(
        "Google sign-in was not completed",
      );
      await page.screenshot({ path: "artifacts/browser/login-desktop.png" });
      await page.route("**/api/config", (route) =>
        route.fulfill({ json: { googleAuth: false } }),
      );
      await page.reload();
      await expect(
        page.getByRole("button", { name: "Continue with Google" }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: /^Sign in/ }),
      ).toBeEnabled();
      await page.unroute("**/api/config");
    },
  );
  await record(
    "server rejects a signup password that bypasses the checklist",
    async () => {
      const response = await page.request.post(
        `${origin}/api/auth/sign-up/email`,
        {
          headers: { Origin: origin },
          data: {
            name: "TEST ONLY weak password",
            email: "weak-password@buildo.test",
            password: "alllowercase123",
          },
        },
      );
      expect(response.status()).toBe(400);
      expect(
        await database
          .collection("user")
          .countDocuments({ email: "weak-password@buildo.test" }),
      ).toBe(0);
    },
  );
  await record(
    "registration creates a real session in disposable MongoDB",
    async () => {
      await register(page, "TEST ONLY Alice", "alice@buildo.test");
    },
  );
  await record(
    "new dashboard shows real empty states and clear creation actions",
    async () => {
      await expect(
        page.getByRole("heading", { name: "A little room for big ideas." }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Your first space belongs here." }),
      ).toBeVisible();
      await expect(page.locator("header.header")).toHaveCount(0);
      await expect(
        page.getByRole("navigation", {
          name: "Workspace navigation",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Sign out", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".dashboard-stat strong").first()).toHaveText(
        "0",
      );
      await page.screenshot({
        path: "artifacts/browser/dashboard-empty.png",
        fullPage: true,
      });
    },
  );
  const me = await (await page.request.get(`${origin}/api/me`)).json();
  const doc = new Document();
  const buffer = doc.createBuffer();
  const position = doc
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0]))
    .setBuffer(buffer);
  const material = doc
    .createMaterial()
    .setBaseColorFactor([0.9, 0.25, 0.08, 1])
    .setDoubleSided(true);
  doc
    .createScene()
    .addChild(
      doc
        .createNode()
        .setMesh(
          doc
            .createMesh()
            .addPrimitive(
              doc
                .createPrimitive()
                .setAttribute("POSITION", position)
                .setMaterial(material),
            ),
        ),
    );
  const model = Buffer.from(await new NodeIO().writeBinary(doc));
  const url =
    "https://res.cloudinary.com/buildo-test-only/raw/upload/local-fixture.glb";
  await context.route(url, (route) =>
    route.fulfill({
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "model/gltf-binary",
      },
      body: model,
    }),
  );
  const assetId = new ObjectId();
  await database.collection("assets").insertOne({
    _id: assetId,
    ownerId: me.id,
    name: "TEST ONLY · local mesh fixture",
    source: "LOCAL TEST FIXTURE — not Lux3D or Cloudinary verified",
    secureUrl: url,
    allowReuse: true,
    rightsConfirmed: true,
    normalization: { scale: 1, offset: [0, 0, 0] },
    status: "ready",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  let projectId;
  await record(
    "create, transform, save, hard reload restores exact transforms",
    async () => {
      await page.goto(`${origin}/projects/new`);
      await page
        .getByLabel("Give your space a name")
        .fill("TEST ONLY browser room");
      await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
        timeout: 30000,
      });
      await page.screenshot({
        path: "artifacts/browser/new-project-desktop.png",
        fullPage: true,
      });
      await page.getByRole("button", { name: "Open the studio" }).click();
      await expect(page).toHaveURL(/\/studio\//);
      projectId = new URL(page.url()).pathname.split("/").pop();
      await page
        .getByRole("button", {
          name: "+ TEST ONLY · local mesh fixture",
          exact: true,
        })
        .click();
      await expect(
        page.getByText("Object properties", { exact: true }),
      ).toBeVisible();
      await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
        timeout: 30000,
      });
      const nums = page.locator(".numeric-grid");
      await nums.nth(0).getByLabel("X", { exact: true }).fill("1.25");
      await nums.nth(0).getByLabel("X", { exact: true }).blur();
      await nums.nth(1).getByLabel("Y", { exact: true }).fill("45");
      await nums.nth(1).getByLabel("Y", { exact: true }).blur();
      await nums.nth(2).getByLabel("X", { exact: true }).fill("1.5");
      await nums.nth(2).getByLabel("X", { exact: true }).blur();
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        page.getByText("● Unsaved changes", { exact: false }),
      ).toHaveCount(0);
      const saved = await (
        await page.request.get(`${origin}/api/projects/${projectId}`)
      ).json();
      expect(saved.project.scene.objects[0].position[0]).toBe(1.25);
      expect(saved.project.scene.objects[0].rotation[1]).toBeCloseTo(
        Math.PI / 4,
      );
      expect(saved.project.scene.objects[0].scale).toEqual([1.5, 1.5, 1.5]);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "TEST ONLY browser room" }),
      ).toBeVisible();
      const reopened = await (
        await page.request.get(`${origin}/api/projects/${projectId}`)
      ).json();
      expect(reopened.project.scene).toEqual(saved.project.scene);
      await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
        timeout: 30000,
      });
      await page.screenshot({
        path: "artifacts/browser/studio-test-fixture.png",
      });
    },
  );
  await record(
    "theme persists across reload, follows the device and preserves saved scene",
    async () => {
      const before = await (
        await page.request.get(`${origin}/api/projects/${projectId}`)
      ).json();
      const lightSwitch = page.getByRole("button", {
        name: "Switch to light mode",
        exact: true,
      });
      if (await lightSwitch.count()) await lightSwitch.click();
      await page
        .getByRole("button", { name: "Switch to dark mode", exact: true })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(
        page.getByRole("button", { name: "Save", exact: true }),
      ).toHaveCSS("background-color", "rgb(37, 48, 39)");
      await page.screenshot({
        path: "artifacts/browser/studio-dark.png",
        fullPage: true,
      });
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(
        page.getByRole("button", { name: "Switch to light mode", exact: true }),
      ).toBeVisible();
      const after = await (
        await page.request.get(`${origin}/api/projects/${projectId}`)
      ).json();
      expect(after.project.scene).toEqual(before.project.scene);
      expect(after.project.revision).toBe(before.project.revision);
      await page.goto(`${origin}/dashboard`);
      await expect(page.locator(".dashboard-heading h1")).toBeVisible();
      await page.screenshot({
        path: "artifacts/browser/dashboard-dark.png",
        fullPage: true,
      });
      await page.goto(origin);
      await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
        timeout: 30000,
      });
      await page.screenshot({
        path: "artifacts/browser/landing-dark.png",
        fullPage: true,
      });
      await page.goto(`${origin}/settings`);
      await expect(
        page.getByRole("button", { name: "Dark", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.screenshot({
        path: "artifacts/browser/settings-dark.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(
        page.getByRole("button", { name: "Switch to light mode", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: "artifacts/browser/settings-dark-mobile.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.getByRole("button", { name: "System", exact: true }).click();
      await page.emulateMedia({ colorScheme: "dark" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.emulateMedia({ colorScheme: "light" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      await page.getByRole("button", { name: "Light", exact: true }).click();
      await page.goto(`${origin}/studio/${projectId}`);
      await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
        timeout: 30000,
      });
    },
  );
  await record(
    "stale tab receives recoverable conflict without overwriting latest revision",
    async () => {
      const latest = await (
        await page.request.get(`${origin}/api/projects/${projectId}`)
      ).json();
      await req(
        page,
        `projects/${projectId}`,
        { revision: latest.project.revision, scene: latest.project.scene },
        "PATCH",
      );
      await page.getByLabel("width (m)", { exact: true }).fill("6");
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Download my edits" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Reload latest version" }).click();
      await expect(page.getByLabel("width (m)", { exact: true })).toHaveValue(
        "5",
      );
      await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
        timeout: 30000,
      });
    },
  );
  await record(
    "debounced autosave persists edits without clicking Save",
    async () => {
      await page.getByLabel("depth (m)", { exact: true }).fill("4.5");
      await page.getByLabel("depth (m)", { exact: true }).blur();
      await expect
        .poll(
          async () => {
            const data = await (
              await page.request.get(`${origin}/api/projects/${projectId}`)
            ).json();
            return data.project.scene.room.depth;
          },
          { timeout: 10000 },
        )
        .toBe(4.5);
      await expect(
        page.getByText("● Unsaved changes", { exact: false }),
      ).toHaveCount(0);
      await page.reload();
      await expect(page.getByLabel("depth (m)", { exact: true })).toHaveValue(
        "4.5",
      );
      await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
        timeout: 30000,
      });
    },
  );
  let publicationId;
  let publicChallengeId;
  await record(
    "preview captures a real viewport and publishes immutable snapshot",
    async () => {
      await page.getByRole("button", { name: "Share / Publish" }).click();
      await page
        .getByRole("button", { name: "Capture current view as cover" })
        .click();
      await expect(
        page.getByText("Viewport cover captured.", { exact: false }),
      ).toBeVisible();
      const screenshotNote = await page
        .getByText("Viewport cover captured.", { exact: false })
        .textContent();
      expect(screenshotNote).toContain("captured");
      // Cloudinary is unavailable: API publish intentionally omits cover; capture itself is checked above.
      const current = await (
        await page.request.get(`${origin}/api/projects/${projectId}`)
      ).json();
      const published = await req(page, `projects/${projectId}/publish`, {
        revision: current.project.revision,
        description: "TEST ONLY fixture publication",
        allowRemix: true,
      });
      publicationId = published.id;
      await page.goto(`${origin}/designs/${publicationId}`);
      await expect(
        page.getByRole("heading", { name: "TEST ONLY browser room" }),
      ).toBeVisible();
      await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
        timeout: 30000,
      });
    },
  );
  const bobContext = await browser.newContext();
  await bobContext.route(url, (route) =>
    route.fulfill({
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "model/gltf-binary",
      },
      body: model,
    }),
  );
  const bob = await bobContext.newPage();
  bob.on("pageerror", (e) => errors.push(e.stack || e.message));
  await record(
    "second user explores, cannot access private draft, and remixes with attribution",
    async () => {
      await register(bob, "TEST ONLY Bob", "bob@buildo.test");
      const denied = await bob.request.get(
        `${origin}/api/projects/${projectId}`,
      );
      expect(denied.status()).toBe(404);
      await bob.goto(`${origin}/designs/${publicationId}`);
      await bob.getByRole("button", { name: "Remix this space" }).click();
      await expect(bob).toHaveURL(/\/studio\//);
      const p = await (
        await bob.request.get(
          `${origin}/api/projects/${bob.url().split("/").pop()}`,
        )
      ).json();
      expect(p.project.originalId).toBe(publicationId);
      expect(p.project.scene.objects).toHaveLength(1);
    },
  );
  await record(
    "admin creates challenge; pinned project submits; second user votes and withdraws",
    async () => {
      await database
        .collection("user")
        .updateOne({ _id: new ObjectId(me.id) }, { $set: { role: "admin" } });
      const now = Date.now();
      const room = {
        width: 5,
        depth: 4,
        height: 2.8,
        floor: "#d9c3a6",
        wall: "#f0ebe1",
      };
      const c = await req(page, "challenges", {
        title: "TEST ONLY Small Space",
        theme: "Isolated test brief",
        rules: "TEST ONLY. Create from this starting room.",
        room,
        opensAt: new Date(now - 60000).toISOString(),
        submissionsCloseAt: new Date(now + 60000).toISOString(),
        votingCloseAt: new Date(now + 120000).toISOString(),
        status: "active",
      });
      publicChallengeId = c.id;
      const initial = await (
        await page.request.get(`${origin}/api/projects/${projectId}`)
      ).json();
      const p = await req(page, "projects", {
        title: "TEST ONLY Challenge room",
        category: "office",
        scene: initial.project.scene,
        challengeId: c.id,
      });
      const pub = await req(page, `projects/${p.id}/publish`, {
        revision: 0,
        description: "TEST ONLY pinned publication",
        allowRemix: false,
      });
      await req(page, `challenges/${c.id}/submissions`, {
        publicationId: pub.id,
      });
      await database
        .collection("challenges")
        .updateOne(
          { _id: new ObjectId(c.id) },
          { $set: { submissionsCloseAt: new Date(now - 1) } },
        );
      await bob.goto(`${origin}/challenges/${c.id}`);
      await bob.getByRole("button", { name: "Vote", exact: true }).click();
      await expect(
        bob.getByRole("button", { name: "Withdraw vote" }),
      ).toBeVisible();
      await bob.getByRole("button", { name: "Withdraw vote" }).click();
      await expect(
        bob.getByRole("button", { name: "Vote", exact: true }),
      ).toBeVisible();
    },
  );
  await record(
    "community members see Explore and Challenges inside the workspace",
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${origin}/explore`);
      await expect(
        page.getByRole("heading", { name: "A world of perspectives." }),
      ).toBeVisible();
      await expect(page.locator(".workspace-sidebar")).toBeVisible();
      await expect(page.locator("header.header")).toHaveCount(0);
      await expect(
        page.locator(
          '.workspace-sidebar .dashboard-nav a[aria-current="page"]',
        ),
      ).toHaveText("Explore designs");
      await expect(page.locator(".community-gate")).toHaveCount(0);
      await page.screenshot({
        path: "artifacts/browser/workspace-explore.png",
        fullPage: true,
      });
      const list = await (
        await page.request.get(`${origin}/api/challenges`)
      ).json();
      publicChallengeId = list.items[0].id;
      await page.goto(`${origin}/challenges/${publicChallengeId}`);
      await expect(
        page.getByRole("heading", { name: "The brief", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".workspace-sidebar")).toBeVisible();
      await expect(
        page.locator(
          '.workspace-sidebar .dashboard-nav a[aria-current="page"]',
        ),
      ).toHaveText("Challenges");
    },
  );
  await record(
    "visitor previews omit full content and sign-in returns to the chosen design",
    async () => {
      const guestContext = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      const guest = await guestContext.newPage();
      const preview = await (
        await guest.request.get(`${origin}/api/designs/${publicationId}`)
      ).json();
      expect(preview.preview).toBe(true);
      expect(preview.design.scene).toBeUndefined();
      expect(preview.assets).toEqual([]);
      const brief = await (
        await guest.request.get(`${origin}/api/challenges/${publicChallengeId}`)
      ).json();
      expect(brief.preview).toBe(true);
      expect(brief.rules).toBeUndefined();
      expect(brief.room).toBeUndefined();
      const entries = await guest.request.get(
        `${origin}/api/challenges/${publicChallengeId}/submissions`,
      );
      expect(entries.status()).toBe(401);
      await guest.goto(`${origin}/explore`);
      await expect(guest.locator("header.header")).toBeVisible();
      await expect(guest.locator(".community-gate")).toBeVisible();
      await expect(
        guest.getByRole("button", { name: "Next", exact: true }),
      ).toHaveCount(0);
      await guest.goto(`${origin}/challenges/${publicChallengeId}`);
      await expect(
        guest.getByRole("heading", { name: "See the whole challenge." }),
      ).toBeVisible();
      await expect(
        guest.getByRole("heading", { name: "The brief", exact: true }),
      ).toHaveCount(0);
      await guest.screenshot({
        path: "artifacts/browser/public-challenge-preview.png",
        fullPage: true,
      });
      await guest.goto(`${origin}/designs/${publicationId}`);
      await expect(
        guest.getByRole("heading", { name: "Step inside this space." }),
      ).toBeVisible();
      await expect(guest.locator("canvas")).toHaveCount(0);
      await guest.screenshot({
        path: "artifacts/browser/public-design-preview.png",
        fullPage: true,
      });
      await guest
        .getByRole("link", { name: "Sign in to explore", exact: true })
        .click();
      await expect(guest).toHaveURL(
        `${origin}/login?next=${encodeURIComponent("/designs/" + publicationId)}`,
      );
      await guest.getByLabel("Email", { exact: true }).fill("bob@buildo.test");
      await guest
        .getByLabel("Password", { exact: true })
        .fill("Buildo-test-password-123");
      await guest.getByRole("button", { name: /^Sign in/ }).click();
      await expect(guest).toHaveURL(`${origin}/designs/${publicationId}`);
      await expect(guest.locator(".workspace-sidebar")).toBeVisible();
      await expect(guest.locator(".community-gate")).toHaveCount(0);
      const full = await (
        await guest.request.get(`${origin}/api/designs/${publicationId}`)
      ).json();
      expect(full.preview).toBe(false);
      expect(full.design.scene.objects).toHaveLength(1);
      await guestContext.close();
    },
  );
  await record(
    "dashboard resumes projects, filters spaces and reflects real library totals",
    async () => {
      await page.goto(`${origin}/dashboard`);
      await expect(
        page.getByRole("heading", { name: "Pick up where you left off." }),
      ).toBeVisible();
      await expect(page.locator(".dashboard-project-card")).toHaveCount(2);
      await expect(page.locator(".dashboard-stat strong").nth(0)).toHaveText(
        "2",
      );
      await expect(page.locator(".dashboard-stat strong").nth(1)).toHaveText(
        "1",
      );
      await expect(page.locator(".dashboard-stat strong").nth(2)).toHaveText(
        "2",
      );
      await page
        .getByRole("textbox", { name: "Search your spaces" })
        .fill("browser room");
      await expect(page.locator(".dashboard-project-card")).toHaveCount(1);
      await expect(page.locator(".dashboard-project-card")).toContainText(
        "TEST ONLY browser room",
      );
      await page
        .getByRole("textbox", { name: "Search your spaces" })
        .fill("no matching project");
      await expect(
        page.getByRole("heading", { name: "No spaces found." }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Clear filters" }).click();
      await expect(page.locator(".dashboard-project-card")).toHaveCount(2);
      await page
        .getByRole("combobox", { name: "Filter by category" })
        .selectOption("restaurant");
      await expect(
        page.getByRole("heading", { name: "No spaces found." }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Clear filters" }).click();
      await expect(page.locator(".dashboard-project-card")).toHaveCount(2);
      await page
        .getByRole("combobox", { name: "Sort spaces" })
        .selectOption("title");
      await expect(page.locator(".dashboard-project-card")).toHaveCount(2);
      await page.screenshot({
        path: "artifacts/browser/dashboard-desktop.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: "artifacts/browser/dashboard-mobile.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
    },
  );
  await record(
    "shared workspace navigation stays consistent across screens and mobile",
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      for (const [path, title, label] of [
        ["/assets", "Objects with possibility.", "Asset library"],
        ["/settings", "A place of your own.", "Account settings"],
        ["/projects/new", "What will you build?", "New space"],
        ["/admin/challenges", "Open a new possibility.", "Administration"],
      ]) {
        await page.goto(`${origin}${path}`);
        await expect(
          page.getByRole("heading", { name: title, exact: true }),
        ).toBeVisible();
        await expect(page.locator("header.header")).toHaveCount(0);
        await expect(
          page.locator(
            '.workspace-sidebar .dashboard-nav a[aria-current="page"]',
          ),
        ).toHaveText(label);
        await expect(page.locator(".workspace-content .tabs")).toHaveCount(0);
        await expect(page.locator("main#main")).toHaveCount(1);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      }
      await page.goto(`${origin}/assets`);
      await page.screenshot({
        path: "artifacts/browser/workspace-assets-desktop.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator(".workspace-mobile-menu summary").click();
      await expect(
        page
          .getByRole("navigation", { name: "Mobile workspace menu" })
          .getByRole("button", { name: "Sign out", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("navigation", { name: "Mobile workspace menu" })
        .getByRole("link", { name: "Account settings", exact: true })
        .click();
      await expect(page).toHaveURL(`${origin}/settings`);
      await expect(page.locator(".workspace-mobile-menu")).not.toHaveAttribute(
        "open",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: "artifacts/browser/workspace-settings-mobile.png",
        fullPage: true,
      });
      await page.goto(`${origin}/studio/${projectId}`);
      await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
        timeout: 30000,
      });
      await expect(page.locator("header.header")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await expect(
        page.getByRole("complementary", { name: "Workspace sidebar" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Back to workspace", exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: "artifacts/browser/workspace-studio-desktop.png",
        fullPage: true,
      });
      await page.goto(`${origin}/`);
      await expect(page.locator("header.header")).toBeVisible();
    },
  );
  await record("mobile layout has no horizontal overflow", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin);
    await expect(page.getByRole("heading").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible({
      timeout: 30000,
    });
    await page.screenshot({
      path: "artifacts/browser/landing-mobile.png",
      fullPage: true,
    });
  });
  await record(
    "public snapshot metadata and sitemap exclude private drafts",
    async () => {
      const published = await page.request.get(
        `${origin}/designs/${publicationId}`,
      );
      const html = await published.text();
      expect(html).toContain("TEST ONLY browser room");
      expect(html).toContain('property="og:title"');
      expect(html).toContain(`/designs/${publicationId}`);
      const missing = await page.request.get(
        `${origin}/designs/not-a-valid-id`,
      );
      expect(missing.status()).toBe(404);
      const sitemap = await (
        await page.request.get(`${origin}/sitemap.xml`)
      ).text();
      expect(sitemap).toContain(`/designs/${publicationId}`);
      expect(sitemap).not.toContain("/studio/");
      expect(sitemap).not.toContain("/dashboard");
      expect(sitemap).not.toContain("/login");
      const studio = await page.request.get(`${origin}/studio/${projectId}`);
      expect(studio.headers()["x-robots-tag"]).toContain("noindex");
    },
  );
  await record(
    "workspace sign out clears access and returns to public navigation",
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${origin}/dashboard`);
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(page).toHaveURL(origin + "/");
      await expect(page.locator("header.header")).toBeVisible();
      const privateResponse = await page.request.get(`${origin}/api/projects`);
      expect(privateResponse.status()).toBe(401);
    },
  );
  expect(errors).toEqual([]);
  console.log("PASS no uncaught browser errors");
  console.log(
    "All browser checks passed. All data was TEST ONLY in disposable MongoDB. No live provider integration tested.",
  );
} catch (e) {
  console.error("BROWSER CHECK FAILED", e);
  console.error(serverLog.slice(-4000));
  process.exitCode = 1;
} finally {
  await browser?.close();
  app.kill("SIGTERM");
  await client.close();
  await mongo.stop();
}
