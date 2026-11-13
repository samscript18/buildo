import "server-only";
import { z } from "zod";
import { Asset, view } from "./models";
import { fail } from "./errors";
import { uploadModel } from "./storage";
import { rate, pagination, readBounded } from "./http";
import { MAX_MODEL_BYTES } from "@/lib/glb";
export async function assets(request: Request, user: { id: string }) {
  if (request.method === "GET") {
    const { skip, limit } = pagination(request);
    return {
      items: (
        await Asset.find({ ownerId: user.id, status: "ready" })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
      ).map((a) => ({ ...view(a), sourceUrl: undefined })),
    };
  }
  await rate(`upload:${user.id}`, 6, 3600);
  if (
    Number(request.headers.get("content-length") || 0) >
    MAX_MODEL_BYTES + 20000
  )
    fail(413, "MODEL_SIZE", "Use a GLB below 25MB.");
  const bytes = await readBounded(request, MAX_MODEL_BYTES + 20000);
  const form = await new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": request.headers.get("Content-Type") || "" },
  }).formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > MAX_MODEL_BYTES)
    fail(400, "MODEL", "Choose a GLB below 25MB.");
  const input = z
    .object({
      name: z.string().trim().min(1).max(100),
      taskId: z.string().trim().min(1).max(100),
      sourceUrl: z.url().refine((s) => new URL(s).protocol === "https:"),
      prompt: z.string().max(1200),
      allowReuse: z.enum(["true", "false"]).transform((v) => v === "true"),
      rightsConfirmed: z.literal("true"),
    })
    .parse(
      Object.fromEntries(
        [
          "name",
          "taskId",
          "sourceUrl",
          "prompt",
          "allowReuse",
          "rightsConfirmed",
        ].map((k) => [k, form.get(k)]),
      ),
    );
  const stored = await uploadModel(
    new Uint8Array(await file.arrayBuffer()),
    user.id,
  );
  return view(
    (
      await Asset.create({
        ...input,
        ...stored,
        ownerId: user.id,
        rightsConfirmed: true,
        source: "User-supplied Lux3D export (user attested)",
      })
    ).toObject(),
  );
}
