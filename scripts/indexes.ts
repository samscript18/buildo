import mongoose from "mongoose";
// Run with --conditions=react-server because application modules protect server imports.
const { allModels } = await import("../src/server/models");
if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in .env.local");
await mongoose.connect(process.env.MONGODB_URI);
await mongoose.connection
  .db!.collection("user")
  .createIndex({ email: 1 }, { unique: true, name: "user_email_uidx" });
await mongoose.connection
  .db!.collection("session")
  .createIndex({ token: 1 }, { unique: true, name: "session_token_uidx" });
for (const m of allModels) {
  await m.createIndexes();
  console.log(`Created indexes: ${m.modelName}`);
}
await mongoose.disconnect();
