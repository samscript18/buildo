import { afterEach, expect, it, vi } from "vitest";
import { queryLux } from "../src/server/lux3d";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("accepts the observed running Lux3D response with null output slots", async () => {
  vi.stubEnv("LUX3D_API_KEY", "test-only");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        c: "0",
        d: { taskId: 7232531, status: 1, outputs: [null, null] },
      }),
    ),
  );
  expect(await queryLux("7232531")).toEqual({
    taskId: 7232531,
    status: 1,
    outputs: [],
  });
});
it("preserves real output entries while ignoring empty slots", async () => {
  vi.stubEnv("LUX3D_API_KEY", "test-only");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        c: "0",
        d: {
          taskId: 1,
          status: 3,
          outputs: [null, { content: "https://example.com/model.glb" }],
        },
      }),
    ),
  );
  expect((await queryLux("1")).outputs).toEqual([
    { content: "https://example.com/model.glb" },
  ]);
});
