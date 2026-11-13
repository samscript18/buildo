// Read-only service checks. Never prints secrets, tokens or provider output URLs.
import { MongoClient } from "mongodb";
import { v2 as cloudinary } from "cloudinary";
const required = [
  "MONGODB_URI",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "LUX3D_API_KEY",
];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.log(JSON.stringify({ missing }));
  process.exitCode = 1;
} else {
  const results = {};
  const mongo = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  });
  try {
    await mongo.connect();
    await mongo.db().command({ ping: 1 });
    results.mongodb = "reachable";
    if (process.argv[2]) {
      const user = await mongo
        .db()
        .collection("user")
        .findOne(
          { email: process.argv[2].toLowerCase() },
          { projection: { _id: 1 } },
        );
      results.account = user ? "exists" : "not registered";
    }
  } catch (error) {
    results.mongodb = `failed (${error.name || "unknown"})`;
  } finally {
    await mongo.close();
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  try {
    const ping = await cloudinary.api.ping({ timeout: 10000 });
    results.cloudinary =
      ping.status === "ok" ? "authenticated" : "unexpected response";
  } catch (error) {
    results.cloudinary = `failed (HTTP ${error.http_code || "unavailable"})`;
  }
  try {
    const response = await fetch(
      "https://api.aholo.ai/global/lux3d/v1/generate/task/list?page=1&pagesize=1",
      {
        headers: { Authorization: process.env.LUX3D_API_KEY },
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      },
    );
    const data = await response.json();
    results.lux3d =
      response.ok && data.c === "0"
        ? "authenticated (read-only task listing)"
        : `failed (HTTP ${response.status}, provider code ${String(data.c)
            .replace(/[^a-zA-Z0-9_-]/g, "")
            .slice(0, 60)})`;
  } catch (error) {
    results.lux3d = `failed (${error.name || "unknown"})`;
  }
  console.log(JSON.stringify(results, null, 2));
  if (Object.values(results).some((value) => value.startsWith("failed")))
    process.exitCode = 1;
}
