import "server-only";
import { z } from "zod";
import { configured, fail } from "./errors";
import { Rate } from "./models";
export function origin(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return;
  if (
    request.headers.get("origin") !==
    new URL(configured("BETTER_AUTH_URL")).origin
  )
    fail(403, "ORIGIN", "Please make this request from Buildo.");
}
export async function readBounded(request: Request, maximum: number) {
  if (Number(request.headers.get("content-length") || 0) > maximum)
    fail(413, "TOO_LARGE", "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) fail(400, "BODY", "A request body is required.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maximum) {
      await reader.cancel();
      fail(413, "TOO_LARGE", "Request is too large.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
export async function body(request: Request) {
  const bytes = await readBounded(request, 1024 * 1024);
  try {
    return JSON.parse(bytes.toString());
  } catch {
    fail(400, "JSON", "Invalid JSON.");
  }
}
export function id(value: string) {
  return z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .parse(value);
}
export function pagination(request: Request) {
  const p = new URL(request.url).searchParams;
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(10000)
    .parse(p.get("page") || 1);
  const limit = z.coerce
    .number()
    .int()
    .min(1)
    .max(30)
    .parse(p.get("limit") || 18);
  return { skip: (page - 1) * limit, limit };
}
export async function rate(key: string, max = 20, seconds = 60) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const doc = await Rate.findOneAndUpdate(
    { _id: `${key}:${bucket}` },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 2) * seconds * 1000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (doc.count > max)
    fail(429, "RATE_LIMIT", "Please wait before trying again.");
}
