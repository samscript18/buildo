import "server-only";
import type { PublicationRecord, ChallengeRecord } from "./models";
import { phase } from "@/lib/scene";
export function designSummary(
  p: Pick<
    PublicationRecord,
    | "_id"
    | "title"
    | "category"
    | "creatorName"
    | "ownerId"
    | "allowRemix"
    | "cover"
    | "description"
    | "publishedAt"
  >,
  preview = false,
) {
  return {
    id: String(p._id),
    title: p.title,
    category: p.category,
    creatorName: p.creatorName,
    ownerId: p.ownerId,
    allowRemix: p.allowRemix,
    cover: p.cover,
    description: preview ? p.description?.slice(0, 160) : p.description,
    publishedAt: p.publishedAt,
  };
}
export function challengePreview(c: ChallengeRecord) {
  return {
    id: String(c._id),
    title: c.title,
    theme: c.theme?.slice(0, 160),
    phase: phase(c),
    opensAt: c.opensAt,
    submissionsCloseAt: c.submissionsCloseAt,
    votingCloseAt: c.votingCloseAt,
    preview: true as const,
  };
}
