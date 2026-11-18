import { afterEach, expect, it, vi } from "vitest";
import { randomBytes, createHash } from "node:crypto";
import { Document, NodeIO } from "@gltf-transform/core";
import {
  ALL_EXTENSIONS,
  KHRMaterialsSpecular,
} from "@gltf-transform/extensions";
import sharp from "sharp";
import {
  prepareModelForStorage,
  rawUploadLimit,
} from "../src/server/model-preparation";

async function fixture(textured = false) {
  const document = new Document();
  const buffer = document.createBuffer();
  const positions = document
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array([-1, 0, 0, 1, 0, 0, 0, 2, 0]))
    .setBuffer(buffer);
  const primitive = document
    .createPrimitive()
    .setAttribute("POSITION", positions);
  if (textured) {
    const pixels = randomBytes(1024 * 1024 * 4);
    const image = await sharp(pixels, {
      raw: { width: 1024, height: 1024, channels: 4 },
    })
      .png()
      .toBuffer();
    const texture = document
      .createTexture("Alpha flowers fixture")
      .setImage(new Uint8Array(image))
      .setMimeType("image/png");
    const specular = document
      .createExtension(KHRMaterialsSpecular)
      .setRequired(false)
      .createSpecular()
      .setSpecularFactor(0.7);
    const material = document
      .createMaterial()
      .setAlphaMode("MASK")
      .setDoubleSided(true)
      .setBaseColorTexture(texture)
      .setExtension("KHR_materials_specular", specular);
    primitive.setMaterial(material);
  }
  document
    .createScene()
    .addChild(
      document
        .createNode()
        .setMesh(document.createMesh().addPrimitive(primitive)),
    );
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).writeBinary(document);
}
afterEach(() => vi.unstubAllEnvs());
it("keeps a model already within the account limit byte-for-byte unchanged", async () => {
  const source = await fixture();
  const output = await prepareModelForStorage(source);
  expect(output.bytes).toBe(source);
  expect(output.preparation.method).toBe("original");
  expect(output.preparation.originalSha256).toBe(
    createHash("sha256").update(source).digest("hex"),
  );
});
it("fits oversized textures while preserving mesh, bounds, alpha and material extensions", async () => {
  const source = await fixture(true);
  const hash = createHash("sha256").update(source).digest("hex");
  const result = await prepareModelForStorage(source, 1200000);
  expect(source.byteLength).toBeGreaterThan(1200000);
  expect(result.bytes.byteLength).toBeLessThanOrEqual(1200000);
  expect(result.preparation).toMatchObject({
    method: "resize-textures",
    originalSha256: hash,
    originalBytes: source.byteLength,
    geometryUnchanged: true,
  });
  expect(createHash("sha256").update(source).digest("hex")).toBe(hash);
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const before = await io.readBinary(source),
    after = await io.readBinary(result.bytes);
  expect(after.getRoot().listAccessors()[0].getArray()).toEqual(
    before.getRoot().listAccessors()[0].getArray(),
  );
  const material = after.getRoot().listMaterials()[0];
  expect(material.getAlphaMode()).toBe("MASK");
  expect(material.getDoubleSided()).toBe(true);
  expect(
    material
      .getExtension<import("@gltf-transform/extensions").Specular>(
        "KHR_materials_specular",
      )!
      .getSpecularFactor(),
  ).toBe(0.7);
  const image = after.getRoot().listTextures()[0].getImage()!;
  expect((await sharp(Buffer.from(image)).metadata()).hasAlpha).toBe(true);
});
it("reports when geometry cannot fit, without silently simplifying or uploading it", async () => {
  await expect(
    prepareModelForStorage(await fixture(), 32),
  ).rejects.toMatchObject({ code: "STORAGE_SIZE_LIMIT" });
});
it("validates the configured account limit instead of silently accepting invalid values", () => {
  vi.stubEnv("CLOUDINARY_MAX_RAW_BYTES", "not-a-number");
  expect(rawUploadLimit).toThrow();
});
