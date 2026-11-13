import { it, expect } from "vitest";
import { Document, NodeIO } from "@gltf-transform/core";
import { inspectGlb } from "../src/lib/glb";
async function fixture() {
  const d = new Document();
  const b = d.createBuffer();
  const a = d
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array([-1, 0, 0, 1, 0, 0, 0, 2, 0]))
    .setBuffer(b);
  const p = d.createPrimitive().setAttribute("POSITION", a);
  d.createScene().addChild(
    d.createNode().setMesh(d.createMesh().addPrimitive(p)),
  );
  return new NodeIO().writeBinary(d);
}
it("reads isolated local mesh fixture and preserves source while recording bounds", async () => {
  const bytes = await fixture();
  const before = Buffer.from(bytes);
  const info = await inspectGlb(bytes);
  expect(info.bounds.min).toEqual([-1, 0, 0]);
  expect(info.normalization.scale).toBe(0.5);
  expect(Buffer.from(bytes)).toEqual(before);
});
it("rejects a ZIP advertised as GLB and an invalid header", async () => {
  await expect(
    inspectGlb(new TextEncoder().encode("PK fake archive file content")),
  ).rejects.toThrow();
  const bytes = await fixture();
  bytes[8] = 0;
  await expect(inspectGlb(bytes)).rejects.toThrow();
});
