import { z } from "zod";
export const categories = [
  "bedroom",
  "living room",
  "office",
  "restaurant",
  "gaming room",
  "custom indoor space",
] as const;
const finite = z.number().finite();
export const vector = z.tuple([
  finite.min(-100).max(100),
  finite.min(-100).max(100),
  finite.min(-100).max(100),
]);
export const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const roomSchema = z
  .object({
    width: finite.min(2).max(30),
    depth: finite.min(2).max(30),
    height: finite.min(2).max(8),
    floor: color,
    wall: color,
  })
  .strict();
export const objectSchema = z
  .object({
    instanceId: z.uuid(),
    assetId: z.string().regex(/^[a-f\d]{24}$/i),
    position: vector,
    rotation: vector,
    scale: z.tuple([
      finite.min(0.01).max(20),
      finite.min(0.01).max(20),
      finite.min(0.01).max(20),
    ]),
    color: color.optional(),
  })
  .strict();
export const sceneSchema = z
  .object({
    schemaVersion: z.literal(1),
    environment: z.literal("procedural"),
    room: roomSchema,
    lighting: z.enum(["daylight", "warm", "evening"]),
    camera: z.object({ position: vector, target: vector }).strict(),
    objects: z.array(objectSchema).max(80),
  })
  .strict()
  .superRefine((scene, ctx) => {
    if (
      new Set(scene.objects.map((o) => o.instanceId)).size !==
      scene.objects.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Object instance IDs must be unique",
      });
  });
export type Scene = z.infer<typeof sceneSchema>;
export type SceneObject = z.infer<typeof objectSchema>;
export const defaultScene: Scene = {
  schemaVersion: 1,
  environment: "procedural",
  room: { width: 5, depth: 4, height: 2.8, floor: "#d9c3a6", wall: "#f0ebe1" },
  lighting: "daylight",
  camera: { position: [7, 6, 7], target: [0, 0, 0] },
  objects: [],
};
export type AssetView = {
  id: string;
  name: string;
  secureUrl: string;
  allowReuse: boolean;
  normalization: { scale: number; offset: [number, number, number] };
  source: string;
  taskId?: string;
};
export type ProjectView = {
  id: string;
  title: string;
  category: string;
  brief?: string;
  scene: Scene;
  revision: number;
  updatedAt: string;
  challengeId?: string;
  templateVersion?: string;
  originalId?: string;
  rootId?: string;
};
export function phase(
  c: {
    status: string;
    opensAt: Date | string;
    submissionsCloseAt: Date | string;
    votingCloseAt: Date | string;
  },
  now = new Date(),
): "draft" | "upcoming" | "open" | "voting" | "closed" {
  if (c.status === "draft") return "draft";
  if (now < new Date(c.opensAt)) return "upcoming";
  if (now < new Date(c.submissionsCloseAt)) return "open";
  if (now < new Date(c.votingCloseAt)) return "voting";
  return "closed";
}
export function sameRoom(a: Scene["room"], b: Scene["room"]) {
  return a.width === b.width && a.depth === b.depth && a.height === b.height;
}
