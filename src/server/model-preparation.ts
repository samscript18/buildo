import "server-only";
import { createHash } from "node:crypto";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import sharp from "sharp";
import { inspectGlb, MAX_MODEL_BYTES } from "@/lib/glb";
import { fail } from "./errors";

export const DEFAULT_RAW_UPLOAD_LIMIT = 10 * 1024 * 1024;
export function rawUploadLimit() {
  const value = Number(
    process.env.CLOUDINARY_MAX_RAW_BYTES?.trim() || DEFAULT_RAW_UPLOAD_LIMIT,
  );
  if (!Number.isSafeInteger(value) || value < 1024 || value > MAX_MODEL_BYTES)
    fail(
      503,
      "STORAGE_CONFIGURATION",
      "Model storage has an invalid upload-size configuration.",
    );
  return value;
}
export interface ModelPreparation {
  originalBytes: number;
  originalSha256: string;
  deliveredBytes: number;
  maxUploadBytes: number;
  method: "original" | "resize-textures";
  textureMaxEdge?: number;
  geometryUnchanged: true;
}

// Only embedded PNG/JPEG textures are resized. No mesh simplification, new compression
// extensions, altered transforms or alpha removal. Process images serially for small hosts.
export async function prepareModelForStorage(
  source: Uint8Array,
  limit = rawUploadLimit(),
) {
  let inspection;
  try {
    inspection = await inspectGlb(source);
  } catch {
    fail(
      400,
      "INVALID_MODEL",
      "The generated model is not a supported self-contained static GLB.",
    );
  }
  const preparation: ModelPreparation = {
    originalBytes: source.byteLength,
    originalSha256: createHash("sha256").update(source).digest("hex"),
    deliveredBytes: source.byteLength,
    maxUploadBytes: limit,
    method: "original",
    geometryUnchanged: true,
  };
  if (source.byteLength <= limit)
    return { bytes: source, inspection, preparation };
  const jsonLength = Buffer.from(source).readUInt32LE(12);
  const json = JSON.parse(
    Buffer.from(source).toString("utf8", 20, 20 + jsonLength),
  );
  const supported = new Set(
    ALL_EXTENSIONS.map((extension) => extension.EXTENSION_NAME),
  );
  if ((json.extensionsUsed || []).some((name: string) => !supported.has(name)))
    fail(
      400,
      "INVALID_MODEL",
      "This model contains an unsupported extension that cannot be preserved during storage preparation.",
    );
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const document = await io.readBinary(source);
  for (const edge of [2048, 1024, 512]) {
    for (const texture of document.getRoot().listTextures()) {
      const image = texture.getImage();
      const mime = texture.getMimeType();
      if (!image || (mime !== "image/png" && mime !== "image/jpeg")) continue;
      const pipeline = sharp(Buffer.from(image), {
        limitInputPixels: 4096 * 4096,
        sequentialRead: true,
      }).resize({
        width: edge,
        height: edge,
        fit: "inside",
        withoutEnlargement: true,
      });
      const encoded = await (
        mime === "image/png"
          ? pipeline.png({ compressionLevel: 9 })
          : pipeline.jpeg({ quality: 90 })
      ).toBuffer();
      if (encoded.byteLength < image.byteLength)
        texture.setImage(new Uint8Array(encoded));
    }
    const bytes = await io.writeBinary(document);
    if (bytes.byteLength <= limit) {
      const deliveredInspection = await inspectGlb(bytes);
      if (
        JSON.stringify(deliveredInspection.bounds) !==
          JSON.stringify(inspection.bounds) ||
        deliveredInspection.vertices !== inspection.vertices
      )
        fail(
          502,
          "STORAGE_INTEGRITY",
          "The prepared model did not preserve its original geometry.",
        );
      return {
        bytes,
        inspection: deliveredInspection,
        preparation: {
          ...preparation,
          deliveredBytes: bytes.byteLength,
          method: "resize-textures" as const,
          textureMaxEdge: edge,
        },
      };
    }
  }
  fail(
    413,
    "STORAGE_SIZE_LIMIT",
    "This model is still too large for storage after texture optimisation. It needs a smaller export or a higher storage upload limit; generating it again is not required.",
  );
}
