import "server-only";
import mongoose from "mongoose";
import { allModels } from "./models";
import { configured } from "./errors";
const state = globalThis as typeof globalThis & {
  buildoMongo?: Promise<typeof mongoose>;
};
export async function db() {
  if (!state.buildoMongo)
    state.buildoMongo = mongoose
      .connect(configured("MONGODB_URI"), {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      })
      .then(async (connection) => {
        await Promise.all(allModels.map((m) => m.init()));
        const native = connection.connection.db!;
        await native
          .collection("user")
          .createIndex({ email: 1 }, { unique: true, name: "user_email_uidx" });
        await native
          .collection("session")
          .createIndex(
            { token: 1 },
            { unique: true, name: "session_token_uidx" },
          );
        return connection;
      })
      .catch((e) => {
        state.buildoMongo = undefined;
        throw e;
      });
  return state.buildoMongo;
}
