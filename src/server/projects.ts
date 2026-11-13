import "server-only";
import { designSummary } from "./community-preview";
import { z } from "zod";
import {
  categories,
  sceneSchema,
  sameRoom,
  phase,
  defaultScene,
  type Scene,
} from "@/lib/scene";
import {
  Asset,
  Project,
  Publication,
  Challenge,
  view,
  type ProjectRecord,
} from "./models";
import { fail } from "./errors";
import { body, id, pagination, rate } from "./http";
import { uploadCover } from "./storage";
export async function ownProject(projectId: string, userId: string) {
  const p = await Project.findOne({
    _id: id(projectId),
    ownerId: userId,
    deletedAt: null,
  });
  if (!p) fail(404, "NOT_FOUND", "Project not found.");
  return p;
}
export async function sceneAssets(
  scene: Scene,
  userId: string,
  mode: "private" | "publish" | "remix" = "private",
  originalId?: string,
) {
  const ids = [...new Set(scene.objects.map((o) => o.assetId))];
  const assets = await Asset.find({
    _id: { $in: ids },
    status: "ready",
  }).lean();
  if (assets.length !== ids.length)
    fail(400, "ASSET_UNAVAILABLE", "An asset in this room is unavailable.");
  let inherited = new Set<string>();
  if (originalId) {
    const original = await Publication.findById(originalId).lean();
    if (original?.allowRemix)
      inherited = new Set(original.scene.objects.map((o) => o.assetId));
  }
  for (const a of assets) {
    if (a.ownerId !== userId && !(a.allowReuse && inherited.has(String(a._id))))
      fail(
        403,
        "ASSET_ACCESS",
        "You do not have permission to use an asset in this room.",
      );
    if (mode === "remix" && !a.allowReuse)
      fail(403, "ASSET_REUSE", "An asset in this design cannot be remixed.");
  }
  const vertexCost = scene.objects.reduce(
    (sum, o) =>
      sum + (assets.find((a) => String(a._id) === o.assetId)?.vertices || 0),
    0,
  );
  const pixelCost = assets.reduce((sum, a) => sum + (a.texturePixels || 0), 0);
  const byteCost = assets.reduce((sum, a) => sum + (a.bytes || 0), 0);
  if (
    vertexCost > 1500000 ||
    pixelCost > 48 * 1024 * 1024 ||
    byteCost > 100 * 1024 * 1024
  )
    fail(
      400,
      "SCENE_BUDGET",
      "This room exceeds its asset budget. Remove objects or use lighter models and textures.",
    );
  return assets;
}
export async function publicAssets(scene: Scene) {
  const assets = await Asset.find({
    _id: { $in: scene.objects.map((o) => o.assetId) },
    status: "ready",
  }).lean();
  return assets.map((a) => ({
    id: String(a._id),
    name: a.name,
    secureUrl: a.secureUrl,
    normalization: a.normalization,
    allowReuse: a.allowReuse,
    source: a.source,
    taskId: a.taskId,
  }));
}
const createSchema = z
  .object({
    title: z.string().trim().min(1).max(100),
    category: z.enum(categories),
    brief: z.string().trim().max(1500).default(""),
    scene: sceneSchema,
    challengeId: z.string().optional(),
  })
  .strict();
export async function projectCollection(
  request: Request,
  user: { id: string },
) {
  if (request.method === "GET") {
    const { skip, limit } = pagination(request);
    const params = new URL(request.url).searchParams;
    const search = z
      .string()
      .trim()
      .max(80)
      .parse(params.get("search") || "");
    const category = z
      .enum(categories)
      .optional()
      .parse(params.get("category") || undefined);
    const sort = z
      .enum(["recent", "oldest", "title"])
      .parse(params.get("sort") || "recent");
    const filter = {
      ownerId: user.id,
      deletedAt: null,
      ...(category ? { category } : {}),
      ...(search
        ? {
            title: {
              $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              $options: "i",
            },
          }
        : {}),
    };
    const order: Record<string, 1 | -1> =
      sort === "title"
        ? { title: 1, _id: 1 }
        : sort === "oldest"
          ? { updatedAt: 1, _id: 1 }
          : { updatedAt: -1, _id: -1 };
    const [items, total] = await Promise.all([
      Project.find(filter).sort(order).skip(skip).limit(limit).lean(),
      Project.countDocuments(filter),
    ]);
    return {
      items: items.map(view),
      total,
      hasNext: skip + items.length < total,
    };
  }
  const input = createSchema.parse(await body(request));
  await rate(`create:${user.id}`, 20);
  let pinned = {};
  if (input.challengeId) {
    const c = await Challenge.findById(id(input.challengeId));
    if (!c || phase(c) !== "open")
      fail(
        409,
        "CHALLENGE_CLOSED",
        "This challenge is not accepting new projects.",
      );
    input.scene = { ...structuredClone(defaultScene), room: c.room };
    pinned = { challengeId: String(c._id), templateVersion: c.templateVersion };
  }
  await sceneAssets(input.scene, user.id);
  return view(
    (
      await Project.create({ ...input, ...pinned, ownerId: user.id })
    ).toObject(),
  );
}
export async function projectItem(
  request: Request,
  projectId: string,
  user: { id: string },
) {
  const p = await ownProject(projectId, user.id);
  if (request.method === "GET")
    return { project: view(p.toObject()), assets: await publicAssets(p.scene) };
  if (request.method === "DELETE") {
    await Project.updateOne(
      { _id: p._id, ownerId: user.id },
      { $set: { deletedAt: new Date() } },
    );
    return { deleted: true };
  }
  const input = z
    .object({
      revision: z.number().int().min(0),
      title: z.string().trim().min(1).max(100).optional(),
      scene: sceneSchema,
    })
    .strict()
    .parse(await body(request));
  if (p.challengeId) {
    const c = await Challenge.findById(p.challengeId);
    if (!c || !sameRoom(input.scene.room, c.room))
      fail(400, "TEMPLATE", "Keep the challenge starting room dimensions.");
  }
  await sceneAssets(input.scene, user.id, "private", p.originalId);
  const updated = await Project.findOneAndUpdate(
    { _id: p._id, ownerId: user.id, revision: input.revision, deletedAt: null },
    {
      $set: {
        scene: input.scene,
        ...(input.title ? { title: input.title } : {}),
      },
      $inc: { revision: 1 },
    },
    { returnDocument: "after" },
  );
  if (!updated)
    fail(
      409,
      "REVISION_CONFLICT",
      "This project was saved in another tab. Download your edits, then reload the latest version.",
    );
  return view(updated.toObject());
}
export async function publish(
  request: Request,
  projectId: string,
  user: { id: string; name: string },
) {
  await rate(`publish:${user.id}`, 8);
  const input = z
    .object({
      description: z.string().trim().max(1500),
      allowRemix: z.boolean(),
      revision: z.number().int().min(0),
      cover: z.string().max(600000).optional(),
    })
    .strict()
    .parse(await body(request));
  const p = await ownProject(projectId, user.id);
  if (p.revision !== input.revision)
    fail(
      409,
      "REVISION_CONFLICT",
      "Save and reload the latest project before publishing.",
    );
  const assets = await sceneAssets(p.scene, user.id, "publish", p.originalId);
  if (input.allowRemix && assets.some((a) => !a.allowReuse))
    fail(
      400,
      "ASSET_REUSE",
      "All assets must permit reuse before enabling remix.",
    );
  const cover = input.cover
    ? await uploadCover(input.cover, user.id)
    : undefined;
  return view(
    (
      await Publication.create({
        ownerId: user.id,
        creatorName: user.name,
        projectId: String(p._id),
        title: p.title,
        category: p.category,
        scene: structuredClone(p.scene),
        revision: p.revision,
        description: input.description,
        allowRemix: input.allowRemix,
        cover,
        originalId: p.originalId,
        rootId: p.rootId,
        challengeId: p.challengeId,
        templateVersion: p.templateVersion,
      })
    ).toObject(),
  );
}
export async function designs(
  request: Request,
  designId?: string,
  remixUser?: { id: string },
  viewer?: { id: string },
) {
  const preview = !viewer && !remixUser;
  if (!designId) {
    const paging = pagination(request);
    const skip = preview ? 0 : paging.skip;
    const limit = preview ? 3 : paging.limit;
    const records = await Publication.find()
      .sort({ publishedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit + 1)
      .select(
        "title category creatorName ownerId allowRemix cover description publishedAt",
      )
      .lean();
    return {
      preview,
      items: records.slice(0, limit).map((p) => designSummary(p, preview)),
      hasNext: !preview && records.length > limit,
    };
  }
  const p = await Publication.findById(id(designId)).lean();
  if (!p) fail(404, "NOT_FOUND", "Design not found.");
  if (!remixUser) {
    if (preview)
      return { preview: true, design: designSummary(p, true), assets: [] };
    return {
      preview: false,
      design: view(p),
      assets: await publicAssets(p.scene),
    };
  }
  await rate(`remix:${remixUser.id}`, 10);
  if (!p.allowRemix)
    fail(403, "REMIX_DISABLED", "The creator has not permitted remixing.");
  await sceneAssets(p.scene, p.ownerId, "remix", p.originalId);
  const copy: Partial<ProjectRecord> = {
    ownerId: remixUser.id,
    title: `${p.title.slice(0, 80)} — remix`,
    category: p.category,
    scene: structuredClone(p.scene),
    originalId: String(p._id),
    rootId: p.rootId || String(p._id),
  };
  return view((await Project.create(copy)).toObject());
}
