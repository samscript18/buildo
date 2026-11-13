import { describe, it, expect } from "vitest";
import { defaultScene, sceneSchema, phase } from "../src/lib/scene";
import { useEditor } from "../src/features/editor/store";
describe("scene boundary", () => {
  it("rejects non-finite and oversized scenes", () => {
    const s = structuredClone(defaultScene);
    s.room.width = Infinity;
    expect(sceneSchema.safeParse(s).success).toBe(false);
    s.room.width = 31;
    expect(sceneSchema.safeParse(s).success).toBe(false);
  });
  it("rejects unknown environment claims and duplicate IDs", () => {
    expect(
      sceneSchema.safeParse({ ...defaultScene, environment: "spatialgen" })
        .success,
    ).toBe(false);
    const object = {
      instanceId: crypto.randomUUID(),
      assetId: "012345678901234567890123",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
    expect(
      sceneSchema.safeParse({ ...defaultScene, objects: [object, object] })
        .success,
    ).toBe(false);
  });
  it("resolves UTC boundary instants exactly", () => {
    const c = {
      status: "active",
      opensAt: "2026-11-13T10:00:00Z",
      submissionsCloseAt: "2026-11-14T10:00:00Z",
      votingCloseAt: "2026-11-15T10:00:00Z",
    };
    expect(phase(c, new Date(c.opensAt))).toBe("open");
    expect(phase(c, new Date(c.submissionsCloseAt))).toBe("voting");
    expect(phase(c, new Date(c.votingCloseAt))).toBe("closed");
    expect(phase({ ...c, status: "draft" }, new Date(c.votingCloseAt))).toBe(
      "draft",
    );
  });
  it("restores exact transforms through undo/redo and protects in-flight saved version", () => {
    useEditor.getState().load(defaultScene, []);
    useEditor.getState().add({
      id: "012345678901234567890123",
      name: "Isolated test fixture",
      secureUrl: "https://example.com/test.glb",
      source: "test",
      allowReuse: false,
      normalization: { scale: 1, offset: [0, 0, 0] },
    });
    const s = useEditor.getState(),
      id = s.scene.objects[0].instanceId;
    const v = s.version;
    s.object(id, {
      position: [1, 2, 3],
      rotation: [0, 1, 0],
      scale: [2, 2, 2],
    });
    useEditor.getState().markSaved(v);
    expect(useEditor.getState().dirty).toBe(true);
    useEditor.getState().undo();
    expect(useEditor.getState().scene.objects[0].position).toEqual([0, 0, 0]);
    useEditor.getState().redo();
    expect(useEditor.getState().scene.objects[0].position).toEqual([1, 2, 3]);
  });
});
