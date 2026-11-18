import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/functions";
export const MAX_MODEL_BYTES = 25 * 1024 * 1024;
export async function inspectGlb(bytes: Uint8Array) {
  const buffer = Buffer.from(bytes);
  if (
    buffer.length < 20 ||
    buffer.length > MAX_MODEL_BYTES ||
    buffer.toString("ascii", 0, 4) !== "glTF" ||
    buffer.readUInt32LE(4) !== 2 ||
    buffer.readUInt32LE(8) !== buffer.length
  )
    throw new Error("Use a valid GLB 2.0 file up to 25MB.");
  const jsonLength = buffer.readUInt32LE(12);
  if (buffer.readUInt32LE(16) !== 0x4e4f534a || jsonLength > buffer.length - 20)
    throw new Error("Invalid GLB JSON chunk.");
  const json = JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength));
  if (
    (json.accessors || []).some(
      (a: { count?: number }) =>
        !Number.isInteger(a.count) || a.count! > 900000 || a.count! < 0,
    )
  )
    throw new Error("Model accessor counts exceed the supported limit.");
  if (json.extensionsRequired?.length)
    throw new Error(
      "Compressed or extension-dependent models must be exported as standard GLB first.",
    );
  if (
    (json.buffers || []).some((b: { uri?: string }) => b.uri) ||
    (json.images || []).some((b: { uri?: string }) => b.uri)
  )
    throw new Error(
      "Embed all textures and buffers in the GLB before importing.",
    );
  if ((json.nodes || []).length > 2000 || (json.meshes || []).length > 300)
    throw new Error("This model has too many nodes or meshes.");
  const doc = await new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .readBinary(bytes);
  const root = doc.getRoot();
  if (root.listSkins().length || root.listAnimations().length)
    throw new Error("Import a static, unrigged GLB.");
  let vertices = 0;
  for (const mesh of root.listMeshes())
    for (const p of mesh.listPrimitives())
      vertices += p.getAttribute("POSITION")?.getCount() || 0;
  if (vertices > 900000 || vertices < 3)
    throw new Error("Use a mesh with 3–900,000 vertices.");
  let texturePixels = 0;
  for (const t of root.listTextures()) {
    const size = t.getSize();
    if (!size || size[0] > 4096 || size[1] > 4096)
      throw new Error(
        "Textures must be supported images no larger than 4096 pixels.",
      );
    texturePixels += size[0] * size[1];
  }
  if (texturePixels > 24 * 1024 * 1024)
    throw new Error(
      "Reduce embedded textures to a combined 24 megapixels or less.",
    );
  if (root.listTextures().length > 20)
    throw new Error("Use at most 20 embedded textures.");
  const scene = root.getDefaultScene() || root.listScenes()[0];
  if (!scene) throw new Error("No model scene found.");
  const bounds = getBounds(scene);
  const sizes = bounds.max.map((v, i) => v - bounds.min[i]);
  const longest = Math.max(...sizes);
  if (
    !Number.isFinite(longest) ||
    longest <= 0 ||
    !bounds.min.every(Number.isFinite) ||
    !bounds.max.every(Number.isFinite)
  )
    throw new Error("Model has invalid bounds.");
  return {
    bounds,
    normalization: {
      scale: 1 / longest,
      offset: [
        -(bounds.min[0] + bounds.max[0]) / 2,
        -bounds.min[1],
        -(bounds.min[2] + bounds.max[2]) / 2,
      ] as [number, number, number],
    },
    vertices,
    texturePixels,
  };
}
