import type { MetadataRoute } from "next";
import { siteUrl, indexableSite } from "@/lib/seo";
import { db } from "@/server/db";
import { Publication, Challenge } from "@/server/models";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexableSite()) return [];
  const url = (path: string) => new URL(path, siteUrl()).toString();
  const entries: MetadataRoute.Sitemap = ["/", "/explore", "/challenges"].map(
    (path) => ({ url: url(path) }),
  );
  if (!process.env.MONGODB_URI) return entries;
  await db();
  const [designs, challenges] = await Promise.all([
    Publication.find()
      .select("_id ownerId publishedAt")
      .sort({ publishedAt: -1 })
      .limit(20000)
      .lean(),
    Challenge.find({ status: "active" })
      .select("_id updatedAt")
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean(),
  ]);
  for (const design of designs)
    entries.push({
      url: url(`/designs/${String(design._id)}`),
      lastModified: design.publishedAt,
    });
  for (const challenge of challenges)
    entries.push({
      url: url(`/challenges/${String(challenge._id)}`),
      lastModified: challenge.updatedAt,
    });
  for (const id of new Set(designs.map((d) => d.ownerId)))
    entries.push({ url: url(`/creators/${id}`) });
  return entries;
}
