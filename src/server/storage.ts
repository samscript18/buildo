import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { inspectGlb, MAX_MODEL_BYTES } from "@/lib/glb";
import { AppError, configured, fail } from "./errors";
import type { TransferStage } from "./generation-failures";
import {
  prepareModelForStorage,
  rawUploadLimit,
  type ModelPreparation,
} from "./model-preparation";
function cloud() {
  cloudinary.config({
    cloud_name: configured("CLOUDINARY_CLOUD_NAME"),
    api_key: configured("CLOUDINARY_API_KEY"),
    api_secret: configured("CLOUDINARY_API_SECRET"),
    secure: true,
  });
  return cloudinary;
}
// Classify provider text locally; never retain raw responses, signatures or credentials.
export function storageUploadError(error: unknown) {
  const detail = error as {
    message?: string;
    http_code?: number;
    code?: string;
    name?: string;
  } | null;
  const message = detail?.message || "";
  if (/file size|too large|maximum.*size/i.test(message))
    return new AppError(
      413,
      "STORAGE_SIZE_LIMIT",
      "The prepared model exceeds this storage account's upload limit.",
    );
  if (
    /signature|api.key|cloud.name|unauthoriz/i.test(message) ||
    [401, 403].includes(detail?.http_code || 0)
  )
    return new AppError(
      503,
      "STORAGE_AUTH",
      "Model storage credentials need attention. No new generation is needed.",
    );
  if (
    /timeout|timed out/i.test(message) ||
    detail?.http_code === 499 ||
    /TIMEOUT|TIMEDOUT/.test(detail?.code || "") ||
    /Abort|Timeout/.test(detail?.name || "")
  )
    return new AppError(
      503,
      "STORAGE_TIMEOUT",
      "Model storage timed out. Delivery can retry the same generated model.",
    );
  if (/quota|credits.*exceed|limit.*exceed/i.test(message))
    return new AppError(
      503,
      "STORAGE_QUOTA",
      "Model storage capacity needs attention. No new generation is needed.",
    );
  return new AppError(
    503,
    detail?.http_code ? `HTTP_${detail.http_code}` : "STORAGE_UNAVAILABLE",
    "Model storage is temporarily unavailable.",
  );
}
let storageCheck: { key: string; until: number } | undefined;
export async function assertModelStorage() {
  rawUploadLimit();
  const key = createHash("sha256")
    .update(
      [
        configured("CLOUDINARY_CLOUD_NAME"),
        configured("CLOUDINARY_API_KEY"),
        configured("CLOUDINARY_API_SECRET"),
      ].join("\0"),
    )
    .digest("hex");
  if (storageCheck?.key === key && storageCheck.until > Date.now()) return;
  try {
    await cloud().api.ping({ timeout: 10000 });
    storageCheck = { key, until: Date.now() + 60000 };
  } catch (error) {
    throw storageUploadError(error);
  }
}
export async function uploadModel(
  bytes: Uint8Array,
  ownerId: string,
  onStage?: (
    stage: TransferStage,
    checkpoint?: ModelCheckpoint,
  ) => Promise<void>,
): Promise<ModelCheckpoint> {
  await onStage?.("validate");
  await onStage?.("optimize");
  const prepared = await prepareModelForStorage(bytes);
  bytes = prepared.bytes;
  const inspected = prepared.inspection;
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const publicId = `buildo/${ownerId}/${sha256}.glb`;
  await onStage?.("upload");
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloud().uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: publicId,
        overwrite: false,
        timeout: 60000,
      },
      (e, r) => (e || !r ? reject(storageUploadError(e)) : resolve(r)),
    );
    stream.once("error", (error) => reject(storageUploadError(error)));
    stream.end(Buffer.from(bytes));
  });
  if (!result.secure_url.startsWith("https://res.cloudinary.com/"))
    fail(502, "STORAGE", "Unexpected storage response.");
  const checkpoint = {
    ...inspected,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    format: "glb",
    bytes: result.bytes,
    sha256,
    deliveryPreparation: prepared.preparation,
  };
  await onStage?.("verify_delivery", checkpoint);
  await verifyModelDelivery(checkpoint);
  return checkpoint;
}
export type ModelCheckpoint = Awaited<ReturnType<typeof inspectGlb>> & {
  sha256: string;
  publicId: string;
  secureUrl: string;
  resourceType: UploadApiResponse["resource_type"];
  format: string;
  bytes: number;
  deliveryPreparation?: ModelPreparation;
};
export async function verifyModelDelivery(checkpoint: ModelCheckpoint) {
  const delivered = await boundedDownload(checkpoint.secureUrl, [
    "res.cloudinary.com",
  ]);
  if (
    createHash("sha256").update(delivered).digest("hex") !== checkpoint.sha256
  )
    fail(502, "STORAGE_INTEGRITY", "Stored model could not be verified.");
}
export async function uploadCover(data: string, ownerId: string) {
  if (
    !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data) ||
    data.length > 600000
  )
    fail(400, "COVER", "Use a viewport PNG cover below 450KB.");
  const bytes = Buffer.from(data.split(",")[1], "base64");
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a")
    fail(400, "COVER", "Invalid PNG cover.");
  const r = await cloud().uploader.upload(data, {
    resource_type: "image",
    public_id: `buildo/covers/${ownerId}/${crypto.randomUUID()}`,
    overwrite: false,
    timeout: 60000,
  });
  if (!r.secure_url.startsWith("https://res.cloudinary.com/"))
    fail(502, "STORAGE", "Unexpected cover storage response.");
  return r.secure_url;
}
export function publicAddress(ip: string) {
  if (isIP(ip) === 6) return false;
  const p = ip.split(".").map(Number);
  return (
    isIP(ip) === 4 &&
    p[0] !== 0 &&
    p[0] !== 10 &&
    p[0] !== 127 &&
    p[0] < 224 &&
    !(p[0] === 169 && p[1] === 254) &&
    !(p[0] === 172 && p[1] >= 16 && p[1] <= 31) &&
    !(p[0] === 192 && p[1] === 168) &&
    !(p[0] === 100 && p[1] >= 64 && p[1] <= 127) &&
    !(p[0] === 198 && (p[1] === 18 || p[1] === 19))
  );
}
export async function boundedDownload(url: string, hosts: string[]) {
  const u = new URL(url);
  if (
    u.protocol !== "https:" ||
    u.port ||
    u.username ||
    u.password ||
    !hosts.includes(u.hostname) ||
    isIP(u.hostname)
  )
    fail(
      502,
      "TRANSFER_HOST",
      "Model delivery is awaiting storage configuration.",
    );
  const addresses = await lookup(u.hostname, { all: true, family: 4 });
  if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
    fail(502, "TRANSFER_HOST", "Model delivery address is not supported.");
  // Pin the validated address to the TLS request. No second DNS resolution or redirect.
  return new Promise<Buffer>((resolve, reject) => {
    const req = httpsRequest(
      u,
      {
        method: "GET",
        signal: AbortSignal.timeout(30000),
        lookup: (_host, options, callback) => {
          if (typeof options === "object" && options.all)
            callback(null, [{ address: addresses[0].address, family: 4 }]);
          else callback(null, addresses[0].address, 4);
        },
      },
      (response) => {
        if (
          response.statusCode !== 200 ||
          Number(response.headers["content-length"] || 0) > MAX_MODEL_BYTES
        ) {
          response.destroy();
          reject(
            new (class extends Error {
              code =
                Number(response.headers["content-length"] || 0) >
                MAX_MODEL_BYTES
                  ? "MODEL_SIZE"
                  : `HTTP_${response.statusCode}`;
            })(),
          );
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_MODEL_BYTES) {
            response.destroy(new Error("Model exceeds 25MB."));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      },
    );
    req.on("error", reject);
    req.end();
  });
}
export async function downloadModel(url: string) {
  return boundedDownload(
    url,
    configured("LUX3D_DOWNLOAD_HOSTS")
      .split(",")
      .map((x) => x.trim()),
  );
}
