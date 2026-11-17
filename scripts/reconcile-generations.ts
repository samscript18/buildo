// Scheduled recovery only. This command cannot create any provider generation.
import mongoose from "mongoose";
import { db } from "../src/server/db";
import { reconcileDueGenerations } from "../src/server/generations";
try {
  await db();
  const results = await reconcileDueGenerations(10);
  console.log(JSON.stringify({ processed: results.length, results }));
} catch (error) {
  console.error("Scheduled generation recovery failed", {
    type: error instanceof Error ? error.name : "Unknown",
  });
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
