import { dashboard } from "../src/server/dashboard";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { defaultScene } from "../src/lib/scene";
vi.mock("../src/server/storage", () => ({
  uploadCover: vi.fn(),
  uploadModel: vi.fn(async () => {
    throw new Error("simulated transfer failure");
  }),
  downloadModel: vi.fn(async () => new Uint8Array()),
  verifyModelDelivery: vi.fn(async () => {}),
}));
vi.mock("../src/server/lux3d", () => ({
  createLux: vi.fn(),
  queryLux: vi.fn(),
}));
import {
  allModels,
  Project,
  Asset,
  Publication,
  Challenge,
  Submission,
  Vote,
  Job,
} from "../src/server/models";
import {
  ownProject,
  projectCollection,
  projectItem,
  publish,
  designs,
  sceneAssets,
} from "../src/server/projects";
import { challenges, submissions, vote } from "../src/server/challenges";
import {
  generationCollection,
  generationItem,
  reconcileDueGenerations,
  retryGenerationTransfer,
  generationView,
} from "../src/server/generations";
import {
  uploadModel,
  downloadModel,
  verifyModelDelivery,
} from "../src/server/storage";
import { AppError } from "../src/server/errors";
import { allowAssetRemix } from "../src/server/assets";
import { createLux, queryLux } from "../src/server/lux3d";
const alice = { id: "alice-test", name: "Test Alice", role: "user" },
  bob = { id: "bob-test", name: "Test Bob", role: "user" };
let mongo: MongoMemoryServer;
const request = (data: unknown, method = "POST") =>
  new Request("http://localhost:3000/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
beforeAll(async () => {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `buildo_test_${crypto.randomUUID().replaceAll("-", "")}`,
    },
  });
  await mongoose.connect(mongo.getUri());
  await Promise.all(allModels.map((m) => m.createIndexes()));
});
beforeEach(async () => {
  await Promise.all(allModels.map((m) => m.collection.deleteMany({})));
  vi.clearAllMocks();
  vi.mocked(uploadModel)
    .mockReset()
    .mockRejectedValue(new Error("simulated transfer failure"));
  vi.mocked(verifyModelDelivery).mockReset().mockResolvedValue();
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
async function setup() {
  const a = await Asset.create({
    ownerId: alice.id,
    name: "Isolated test asset",
    source: "TEST ONLY",
    allowReuse: true,
    status: "ready",
    normalization: { scale: 1, offset: [0, 0, 0] },
  });
  const s = structuredClone(defaultScene);
  s.objects.push({
    instanceId: crypto.randomUUID(),
    assetId: String(a._id),
    position: [1, 0, 2],
    rotation: [0, 1, 0],
    scale: [2, 2, 2],
  });
  const p = await Project.create({
    ownerId: alice.id,
    title: "Test room",
    category: "office",
    scene: s,
  });
  return { a, p, s };
}
describe("database invariants (isolated disposable MongoDB only)", () => {
  it("requires owner confirmation before enabling model reuse", async () => {
    const { a } = await setup();
    await Asset.updateOne(
      { _id: a._id },
      { $set: { allowReuse: false, rightsConfirmed: false } },
    );
    await expect(
      allowAssetRemix(request({ rightsConfirmed: true }), String(a._id), bob),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      allowAssetRemix(
        request({ rightsConfirmed: false }),
        String(a._id),
        alice,
      ),
    ).rejects.toThrow();
    expect((await Asset.findById(a._id))!.allowReuse).toBe(false);
    await allowAssetRemix(
      request({ rightsConfirmed: true }),
      String(a._id),
      alice,
    );
    const permitted = await Asset.findById(a._id);
    expect(permitted!.allowReuse).toBe(true);
    expect(permitted!.rightsConfirmed).toBe(true);
  });
  it("denies cross-user reads and asset saves", async () => {
    const { p, s } = await setup();
    await expect(ownProject(String(p._id), bob.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(sceneAssets(s, bob.id)).rejects.toMatchObject({
      code: "ASSET_ACCESS",
    });
  });
  it("uses atomic revisions and restores exact scene on read", async () => {
    const { p, s } = await setup();
    const scene = structuredClone(s);
    scene.objects[0].position = [3, 1, 2];
    await projectItem(
      request({ revision: 0, scene }, "PATCH"),
      String(p._id),
      alice,
    );
    await expect(
      projectItem(
        request({ revision: 0, scene: s }, "PATCH"),
        String(p._id),
        alice,
      ),
    ).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    const reopened = await ownProject(String(p._id), alice.id);
    expect(reopened.scene).toEqual(scene);
    expect(reopened.revision).toBe(1);
  });
  it("keeps publication snapshots fixed after edit and private deletion", async () => {
    const { p, s } = await setup();
    const pub = await publish(
      request({ description: "Test only", allowRemix: true, revision: 0 }),
      String(p._id),
      alice,
    );
    const next = structuredClone(s);
    next.objects = [];
    await projectItem(
      request({ revision: 0, scene: next }, "PATCH"),
      String(p._id),
      alice,
    );
    await projectItem(
      new Request("http://localhost", { method: "DELETE" }),
      String(p._id),
      alice,
    );
    expect((await Publication.findById(pub.id))!.scene).toEqual(s);
    expect(await Asset.countDocuments()).toBe(1);
  });
  it("remixes only permitted snapshots and preserves asset permission and attribution", async () => {
    const { p, a } = await setup();
    const pub = await publish(
      request({ description: "Test", allowRemix: true, revision: 0 }),
      String(p._id),
      alice,
    );
    const copy = await designs(new Request("http://localhost"), pub.id, bob);
    expect(copy.rootId).toBe(pub.id);
    expect(copy.originalId).toBe(pub.id);
    const owned = await ownProject(copy.id, bob.id);
    await expect(
      sceneAssets(owned.scene, bob.id, "private", owned.originalId),
    ).resolves.toHaveLength(1);
    await Asset.updateOne({ _id: a._id }, { $set: { allowReuse: false } });
    await expect(
      designs(new Request("http://localhost"), pub.id, bob),
    ).rejects.toMatchObject({ code: "ASSET_REUSE" });
  });
  it("prevents public creation of admin challenges", async () => {
    await expect(
      challenges(request({}), undefined, alice),
    ).rejects.toMatchObject({ code: "ADMIN" });
  });
  it("enforces pinned template, submission uniqueness, voting windows and self-vote rules", async () => {
    const { p } = await setup();
    const now = Date.now();
    const c = await Challenge.create({
      title: "Test challenge",
      room: defaultScene.room,
      templateVersion: "test-v1",
      status: "active",
      opensAt: new Date(now - 10000),
      submissionsCloseAt: new Date(now + 60000),
      votingCloseAt: new Date(now + 120000),
    });
    p.challengeId = String(c._id);
    p.templateVersion = c.templateVersion;
    await p.save();
    const pub = await publish(
      request({ description: "Test", allowRemix: true, revision: 0 }),
      String(p._id),
      alice,
    );
    const entry = await submissions(
      request({ publicationId: pub.id }),
      String(c._id),
      alice,
    );
    await expect(
      submissions(request({ publicationId: pub.id }), String(c._id), alice),
    ).rejects.toMatchObject({ code: 11000 });
    await expect(
      vote(request({ submissionId: entry.id }), String(c._id), bob),
    ).rejects.toMatchObject({ code: "WINDOW" });
    await Challenge.updateOne(
      { _id: c._id },
      { $set: { submissionsCloseAt: new Date(now - 1) } },
    );
    await expect(
      vote(request({ submissionId: entry.id }), String(c._id), alice),
    ).rejects.toMatchObject({ code: "SELF_VOTE" });
    await vote(request({ submissionId: entry.id }), String(c._id), bob);
    await vote(request({ submissionId: entry.id }), String(c._id), bob);
    expect(await Vote.countDocuments()).toBe(1);
    await vote(
      request({ submissionId: entry.id }, "DELETE"),
      String(c._id),
      bob,
    );
    expect(await Vote.countDocuments()).toBe(0);
    await Challenge.updateOne(
      { _id: c._id },
      { $set: { votingCloseAt: new Date(now - 1) } },
    );
    await expect(
      vote(request({ submissionId: entry.id }), String(c._id), bob),
    ).rejects.toMatchObject({ code: "WINDOW" });
    expect(await Submission.countDocuments()).toBe(1);
  });
  it("persists uncertain submissions and never automatically creates another job", async () => {
    const { p } = await setup();
    for (const key of [
      "LUX3D_API_KEY",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "LUX3D_DOWNLOAD_HOSTS",
    ])
      process.env[key] = "TEST_ONLY";
    vi.mocked(createLux).mockRejectedValue(new Error("timeout"));
    const input = {
      projectId: String(p._id),
      prompt: "Test chair",
      requestKey: crypto.randomUUID(),
      style: "photorealistic",
    };
    const first = await generationCollection(request(input), alice);
    expect(first.state).toBe("unknown");
    const again = await generationCollection(request(input), alice);
    expect(again.id).toBe(first.id);
    expect(createLux).toHaveBeenCalledTimes(1);
    await expect(
      generationCollection(
        request({ ...input, prompt: "Different prompt" }),
        alice,
      ),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY" });
  });
  it("keeps failed transfers recoverable without generating again", async () => {
    const { p } = await setup();
    const j = await Job.create({
      ownerId: alice.id,
      projectId: String(p._id),
      state: "generating",
      providerTaskId: "123",
      requestKey: crypto.randomUUID(),
    });
    vi.mocked(queryLux).mockResolvedValue({
      taskId: 123,
      status: 3,
      outputs: [{ content: "https://example.com/fixture.glb" }],
    });
    const result = await generationItem(String(j._id), alice);
    expect(result.state).toBe("transfer_failed");
    expect(createLux).not.toHaveBeenCalled();
    expect(await Asset.countDocuments()).toBe(1);
    expect((await Job.findById(j._id))!.leaseUntil).toBeUndefined();
  });
});

it("retains uncertain creation after a process interruption without remote resubmission", async () => {
  const job = await Job.create({
    ownerId: alice.id,
    projectId: "test",
    state: "generating",
    requestKey: crypto.randomUUID(),
    createdAt: new Date(Date.now() - 120000),
    activeSlot: "generation",
  });
  const recovered = await generationItem(String(job._id), alice);
  expect(recovered.state).toBe("unknown");
  expect(createLux).not.toHaveBeenCalled();
});
it("keeps another finalizer from acquiring an active lease", async () => {
  const job = await Job.create({
    ownerId: alice.id,
    projectId: "test",
    state: "transferring",
    providerTaskId: "123",
    requestKey: crypto.randomUUID(),
    leaseUntil: new Date(Date.now() + 60000),
  });
  const result = await generationItem(String(job._id), alice);
  expect(result.state).toBe("transferring");
  expect(queryLux).not.toHaveBeenCalled();
});

it("scheduler recovers a stored Cloudinary checkpoint without querying, downloading or generating again", async () => {
  const checkpoint: import("../src/server/storage").ModelCheckpoint = {
    secureUrl: "https://res.cloudinary.com/test/raw/upload/real.glb",
    publicId: "test/real.glb",
    resourceType: "raw",
    format: "glb",
    bytes: 1234,
    sha256: "test",
    vertices: 3,
    texturePixels: 0,
    bounds: { min: [0, 0, 0], max: [1, 1, 1] },
    normalization: { scale: 1, offset: [0, 0, 0] },
  };
  const job = await Job.create({
    ownerId: alice.id,
    projectId: "test",
    state: "transfer_failed",
    providerTaskId: "checkpoint-only",
    prompt: "Retained model",
    requestKey: crypto.randomUUID(),
    transferCheckpoint: checkpoint,
    stage: "verify_delivery",
    failure: { retryable: true },
  });
  const result = await reconcileDueGenerations();
  expect(result).toContainEqual({ id: String(job._id), state: "ready" });
  expect(queryLux).not.toHaveBeenCalled();
  expect(downloadModel).not.toHaveBeenCalled();
  expect(uploadModel).not.toHaveBeenCalled();
  expect(createLux).not.toHaveBeenCalled();
  expect(verifyModelDelivery).toHaveBeenCalledWith(
    expect.objectContaining({ sha256: "test" }),
  );
  expect(await Asset.countDocuments({ generationId: String(job._id) })).toBe(1);
  const saved = (await Job.findById(job._id))!;
  expect(saved.transferCheckpoint).toBeUndefined();
  expect(saved.leaseToken).toBeUndefined();
});

it("records bounded failure stages and backs off, then permits owner-only browser delivery retry", async () => {
  const job = await Job.create({
    ownerId: alice.id,
    projectId: "test",
    state: "generating",
    providerTaskId: "stage-test",
    prompt: "test",
    requestKey: crypto.randomUUID(),
  });
  vi.mocked(queryLux).mockResolvedValue({
    taskId: 1,
    status: 3,
    outputs: [{ content: "https://example.com/model.glb" }],
  });
  vi.mocked(uploadModel).mockImplementation(async (_bytes, _owner, stage) => {
    await stage?.("upload");
    throw new DOMException(
      "secret upstream URL must never be retained",
      "TimeoutError",
    );
  });
  const failed = await generationItem(String(job._id), alice);
  expect(failed.failure).toMatchObject({
    stage: "upload",
    code: "TIMEOUT",
    retryable: true,
  });
  expect(JSON.stringify(failed)).not.toContain("secret upstream");
  expect(new Date(failed.nextPollAt!).getTime()).toBeGreaterThan(Date.now());
  await generationItem(String(job._id), alice);
  expect(uploadModel).toHaveBeenCalledTimes(1);
  await expect(
    retryGenerationTransfer(String(job._id), bob),
  ).rejects.toMatchObject({ code: "DELIVERY_BUSY" });
  await retryGenerationTransfer(String(job._id), alice);
  expect(uploadModel).toHaveBeenCalledTimes(2);
  expect(createLux).not.toHaveBeenCalled();
});

it("pauses configuration failures and never exposes checkpoints or lease tokens to clients", async () => {
  const job = await Job.create({
    ownerId: alice.id,
    state: "generating",
    projectId: "test",
    prompt: "test",
    providerTaskId: "config-test",
    requestKey: crypto.randomUUID(),
  });
  vi.mocked(queryLux).mockResolvedValue({
    taskId: 1,
    status: 3,
    outputs: [{ content: "https://example.com/model.glb" }],
  });
  vi.mocked(uploadModel).mockRejectedValue(
    new AppError(503, "NOT_CONFIGURED", "secret"),
  );
  const failed = await generationItem(String(job._id), alice);
  expect(failed.failure).toMatchObject({
    code: "NOT_CONFIGURED",
    retryable: false,
  });
  expect(await reconcileDueGenerations()).toEqual([]);
  const safe = generationView({
    ...job.toObject(),
    leaseToken: "private-token",
    transferCheckpoint: { secureUrl: "private-storage" },
  } as unknown as import("../src/server/models").JobRecord);
  expect(JSON.stringify(safe)).not.toMatch(
    /private-token|private-storage|transferCheckpoint|leaseToken/,
  );
});

it("fences an expired finalizer from overwriting a newer lease", async () => {
  const job = await Job.create({
    ownerId: alice.id,
    state: "generating",
    projectId: "test",
    prompt: "test",
    providerTaskId: "fence-test",
    requestKey: crypto.randomUUID(),
  });
  vi.mocked(queryLux).mockImplementation(async () => {
    await Job.updateOne(
      { _id: job._id },
      {
        $set: {
          leaseToken: "newer-worker",
          state: "ready",
          assetId: "verified-newer-asset",
        },
      },
    );
    return {
      taskId: 1,
      status: 3,
      outputs: [{ content: "https://example.com/model.glb" }],
    };
  });
  const result = await generationItem(String(job._id), alice);
  expect(result.state).toBe("ready");
  expect(result.assetId).toBe("verified-newer-asset");
  expect(uploadModel).not.toHaveBeenCalled();
  expect((await Job.findById(job._id))!.leaseToken).toBe("newer-worker");
});
it("enforces aggregate scene costs on repeated heavy models", async () => {
  const { a, s } = await setup();
  await Asset.updateOne({ _id: a._id }, { $set: { vertices: 900000 } });
  s.objects.push({ ...s.objects[0], instanceId: crypto.randomUUID() });
  await expect(sceneAssets(s, alice.id)).rejects.toMatchObject({
    code: "SCENE_BUDGET",
  });
});

it("dashboard totals and recent activity remain isolated to their owner", async () => {
  const { p } = await setup();
  await Project.create({
    ownerId: bob.id,
    title: "Other account",
    category: "office",
    scene: defaultScene,
  });
  await Project.create({
    ownerId: alice.id,
    title: "Deleted room",
    category: "office",
    scene: defaultScene,
    deletedAt: new Date(),
  });
  await Asset.create({ ownerId: bob.id, status: "ready" });
  await Publication.create({
    ownerId: alice.id,
    title: "Test publication",
    scene: defaultScene,
  });
  await Publication.create({
    ownerId: bob.id,
    title: "Other publication",
    scene: defaultScene,
  });
  await Job.create({
    ownerId: alice.id,
    projectId: String(p._id),
    prompt: "TEST ONLY active",
    state: "generating",
    requestKey: crypto.randomUUID(),
  });
  await Job.create({
    ownerId: bob.id,
    prompt: "Not visible to Alice",
    state: "generating",
    requestKey: crypto.randomUUID(),
  });
  const result = await dashboard(alice);
  expect(result.counts).toEqual({
    projects: 1,
    assets: 1,
    publications: 1,
    activeGenerations: 1,
    attentionGenerations: 0,
  });
  expect(result.recentProject?.id).toBe(String(p._id));
  expect(result.jobs).toHaveLength(1);
  expect(result.jobs[0].prompt).toBe("TEST ONLY active");
});
it("project search is literal, paginated and category/owner scoped", async () => {
  for (const [title, category, ownerId] of [
    ["Chair (oak)", "office", alice.id],
    ["Chair a", "bedroom", alice.id],
    ["Chair b", "office", alice.id],
    ["Chair (oak)", "office", bob.id],
  ])
    await Project.create({ ownerId, title, category, scene: defaultScene });
  const literal = await projectCollection(
    new Request(
      "http://localhost/api/projects?search=" + encodeURIComponent("(oak)"),
    ),
    alice,
  );
  expect(literal.items).toHaveLength(1);
  expect(literal.total).toBe(1);
  const empty = await projectCollection(
    new Request(
      "http://localhost/api/projects?search=" + encodeURIComponent(".*"),
    ),
    alice,
  );
  expect(empty.items).toHaveLength(0);
  const filtered = await projectCollection(
    new Request(
      "http://localhost/api/projects?category=office&sort=title&limit=1",
    ),
    alice,
  );
  expect(filtered.total).toBe(2);
  expect(filtered.hasNext).toBe(true);
  expect(filtered.items[0].title).toBe("Chair (oak)");
  const second = await projectCollection(
    new Request(
      "http://localhost/api/projects?category=office&sort=title&limit=1&page=2",
    ),
    alice,
  );
  expect(second.hasNext).toBe(false);
  expect(second.items[0].title).toBe("Chair b");
});

it("guest design previews are capped, unpageable and contain no scene or model delivery data", async () => {
  for (let i = 0; i < 5; i++)
    await Publication.create({
      ownerId: alice.id,
      projectId: "private-draft-id",
      title: `Preview ${i}`,
      category: "office",
      creatorName: "Test creator",
      description: "A".repeat(400),
      scene: defaultScene,
    });
  const result = await designs(
    new Request("http://localhost/api/designs?page=99&limit=30"),
  );
  expect(result.preview).toBe(true);
  expect(result.items).toHaveLength(3);
  expect(result.hasNext).toBe(false);
  for (const p of result.items) {
    expect(p.scene).toBeUndefined();
    expect(p.projectId).toBeUndefined();
    expect(p.description).toHaveLength(160);
  }
  const detail = await designs(
    new Request("http://localhost"),
    result.items[0].id,
  );
  expect(detail.preview).toBe(true);
  expect(detail.design.scene).toBeUndefined();
  expect(detail.assets).toEqual([]);
});
it("signed-in viewers receive full published scenes and can paginate the collection", async () => {
  const { p } = await setup();
  const pub = await publish(
    request({
      description: "Full signed-in description",
      allowRemix: true,
      revision: 0,
    }),
    String(p._id),
    alice,
  );
  const full = await designs(
    new Request("http://localhost"),
    pub.id,
    undefined,
    bob,
  );
  expect(full.preview).toBe(false);
  expect(full.design.scene.objects).toHaveLength(1);
  expect(full.assets).toHaveLength(1);
  const list = await designs(
    new Request("http://localhost/api/designs?limit=1"),
    undefined,
    undefined,
    bob,
  );
  expect(list.preview).toBe(false);
  expect(list.items).toHaveLength(1);
});
it("guest challenge previews omit rules and templates, cap lists and reject entry reads", async () => {
  const dates = {
    opensAt: new Date(Date.now() - 1000),
    submissionsCloseAt: new Date(Date.now() + 60000),
    votingCloseAt: new Date(Date.now() + 120000),
  };
  for (let i = 0; i < 5; i++)
    await Challenge.create({
      title: `Challenge ${i}`,
      theme: "A shared starting room",
      rules: "FULL RULES FOR SIGNED-IN MEMBERS ONLY",
      room: defaultScene.room,
      templateVersion: "secret-template",
      status: "active",
      ...dates,
    });
  const draft = await Challenge.create({
    title: "Unpublished",
    theme: "Private",
    status: "draft",
    ...dates,
  });
  const list = await challenges(
    new Request("http://localhost/api/challenges?page=999&limit=30"),
  );
  expect(list.preview).toBe(true);
  expect(list.items).toHaveLength(3);
  expect(list.hasNext).toBe(false);
  const detail = await challenges(
    new Request("http://localhost"),
    list.items[0].id,
  );
  expect(detail.preview).toBe(true);
  expect(detail.rules).toBeUndefined();
  expect(detail.room).toBeUndefined();
  expect(detail.templateVersion).toBeUndefined();
  await expect(
    submissions(new Request("http://localhost"), list.items[0].id),
  ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  await expect(
    challenges(new Request("http://localhost"), String(draft._id)),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  const member = await challenges(
    new Request("http://localhost"),
    list.items[0].id,
    bob,
  );
  expect(member.preview).toBe(false);
  expect(member.rules).toContain("FULL RULES");
  expect(member.room).toEqual(defaultScene.room);
});
