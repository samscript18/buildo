import "server-only";
import { z } from "zod";
import { configured, fail } from "./errors";
const base = "https://api.aholo.ai/global/lux3d/v1/generate";
async function call(path: string, body?: unknown) {
  const response = await fetch(`${base}/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: configured("LUX3D_API_KEY"),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok)
    fail(
      502,
      `HTTP_${response.status}`,
      "The generation provider could not complete the request.",
    );
  const json = await response.json();
  if (json.c !== "0")
    fail(502, "PROVIDER", "The generation provider rejected the request.");
  return json.d;
}
export async function createLux(prompt: string, style: string) {
  const task = await call("text-to-3d/task/create", {
    prompt,
    style,
    version: "G1",
    faceCount: 50000,
    outputFormat: ["glb"],
  });
  return String(
    z.number().int().positive().max(Number.MAX_SAFE_INTEGER).parse(task),
  );
}
export async function queryLux(taskId: string) {
  return z
    .object({
      taskId: z.number().int(),
      status: z.union([
        z.literal(0),
        z.literal(1),
        z.literal(3),
        z.literal(4),
        z.literal(6),
      ]),
      outputs: z
        .array(z.object({ content: z.string() }).nullable())
        .nullish()
        .transform((outputs) =>
          (outputs ?? []).filter((output) => output !== null),
        ),
    })
    .parse(await call(`task/get?taskid=${encodeURIComponent(taskId)}`));
}
