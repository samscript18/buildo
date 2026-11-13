import "server-only";
import { cache } from "react";
import { ObjectId } from "mongodb";
import { db } from "./db";
import { Publication, Challenge } from "./models";
const validId = (value: string) => /^[a-f\d]{24}$/i.test(value);
export const publicDesign = cache(async (id: string) => {
  if (!validId(id)) return { state: "missing" as const };
  if (!process.env.MONGODB_URI) return { state: "unavailable" as const };
  try {
    await db();
    const design = await Publication.findById(id)
      .select(
        "title description category creatorName ownerId cover publishedAt",
      )
      .lean();
    return design
      ? {
          state: "found" as const,
          design: { ...design, description: design.description?.slice(0, 160) },
        }
      : { state: "missing" as const };
  } catch {
    return { state: "unavailable" as const };
  }
});
export const publicChallenge = cache(async (id: string) => {
  if (!validId(id)) return { state: "missing" as const };
  if (!process.env.MONGODB_URI) return { state: "unavailable" as const };
  try {
    await db();
    const challenge = await Challenge.findOne({ _id: id, status: "active" })
      .select("title theme")
      .lean();
    return challenge
      ? {
          state: "found" as const,
          challenge: { ...challenge, theme: challenge.theme?.slice(0, 160) },
        }
      : { state: "missing" as const };
  } catch {
    return { state: "unavailable" as const };
  }
});
export const publicCreator = cache(async (id: string) => {
  if (!validId(id)) return { state: "missing" as const };
  if (!process.env.MONGODB_URI) return { state: "unavailable" as const };
  try {
    const connection = await db();
    const published = await Publication.exists({ ownerId: id });
    if (!published) return { state: "missing" as const };
    const user = await connection.connection
      .db!.collection("user")
      .findOne({ _id: new ObjectId(id) }, { projection: { name: 1 } });
    return user
      ? { state: "found" as const, name: String(user.name) }
      : { state: "missing" as const };
  } catch {
    return { state: "unavailable" as const };
  }
});
