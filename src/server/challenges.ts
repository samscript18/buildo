import "server-only";
import { challengePreview } from "./community-preview";
import { z } from "zod";
import { phase, roomSchema, sameRoom } from "@/lib/scene";
import { Challenge, Submission, Publication, Vote, view } from "./models";
import { body, id, pagination, rate } from "./http";
import { fail } from "./errors";
const configSchema = z
  .object({
    title: z.string().trim().min(3).max(100),
    theme: z.string().trim().min(3).max(300),
    rules: z.string().trim().min(10).max(3000),
    room: roomSchema,
    opensAt: z.iso.datetime(),
    submissionsCloseAt: z.iso.datetime(),
    votingCloseAt: z.iso.datetime(),
    status: z.enum(["draft", "active"]),
  })
  .strict()
  .refine(
    (c) =>
      new Date(c.opensAt) < new Date(c.submissionsCloseAt) &&
      new Date(c.submissionsCloseAt) < new Date(c.votingCloseAt),
    { message: "Windows must be in chronological order." },
  );
export async function challenges(
  request: Request,
  challengeId?: string,
  user?: { id: string; role: string },
) {
  if (request.method !== "GET") {
    if (user?.role !== "admin")
      fail(403, "ADMIN", "Administrator access is required.");
    const input = configSchema.parse(await body(request));
    await rate(`challenge:${user.id}`, 10);
    if (challengeId) {
      const c = await Challenge.findOneAndUpdate(
        { _id: id(challengeId), status: "draft" },
        { $set: input },
        { returnDocument: "after" },
      );
      if (!c)
        fail(409, "TEMPLATE_PINNED", "Only a draft challenge can be edited.");
      return view(c.toObject());
    }
    return view(
      (
        await Challenge.create({
          ...input,
          templateVersion: crypto.randomUUID(),
          createdBy: user.id,
        })
      ).toObject(),
    );
  }
  if (challengeId) {
    const c = await Challenge.findById(id(challengeId)).lean();
    if (!c || (c.status === "draft" && user?.role !== "admin"))
      fail(404, "NOT_FOUND", "Challenge not found.");
    return user
      ? { ...view(c), phase: phase(c), preview: false }
      : challengePreview(c);
  }
  const paging = pagination(request);
  const preview = !user;
  const skip = preview ? 0 : paging.skip;
  const limit = preview ? 3 : paging.limit;
  const filter =
    user?.role === "admin" &&
    new URL(request.url).searchParams.get("admin") === "true"
      ? {}
      : { status: "active" };
  const records = await Challenge.find(filter)
    .sort({ opensAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit + 1)
    .lean();
  return {
    preview,
    items: records
      .slice(0, limit)
      .map((c) =>
        user
          ? { ...view(c), phase: phase(c), preview: false }
          : challengePreview(c),
      ),
    hasNext: !preview && records.length > limit,
  };
}
export async function submissions(
  request: Request,
  challengeId: string,
  user?: { id: string },
) {
  if (!user) fail(401, "UNAUTHENTICATED", "Sign in to view challenge entries.");
  const c = await Challenge.findOne({
    _id: id(challengeId),
    status: "active",
  }).lean();
  if (!c) fail(404, "NOT_FOUND", "Challenge not found.");
  if (request.method === "POST") {
    if (!user) fail(401, "UNAUTHENTICATED", "Sign in to submit.");
    await rate(`submit:${user.id}`, 8);
    if (phase(c) !== "open") fail(409, "WINDOW", "Submissions are closed.");
    const input = z
      .object({ publicationId: z.string() })
      .strict()
      .parse(await body(request));
    const p = await Publication.findOne({
      _id: id(input.publicationId),
      ownerId: user.id,
    }).lean();
    if (!p) fail(404, "NOT_FOUND", "Publication not found.");
    if (
      p.challengeId !== challengeId ||
      p.templateVersion !== c.templateVersion ||
      !sameRoom(p.scene.room, c.room)
    )
      fail(
        400,
        "TEMPLATE",
        "Create a project from this challenge’s starting room and publish it first.",
      );
    return view(
      (
        await Submission.create({
          challengeId,
          ownerId: user.id,
          publicationId: String(p._id),
        })
      ).toObject(),
    );
  }
  const { skip, limit } = pagination(request);
  const items = await Submission.aggregate([
    { $match: { challengeId } },
    {
      $lookup: {
        from: Vote.collection.name,
        let: { sid: { $toString: "$_id" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$submissionId", "$$sid"] } } },
          { $count: "count" },
        ],
        as: "voteCount",
      },
    },
    {
      $addFields: {
        votes: { $ifNull: [{ $arrayElemAt: ["$voteCount.count", 0] }, 0] },
      },
    },
    { $sort: { votes: -1, submittedAt: 1, _id: 1 } },
    { $skip: skip },
    { $limit: limit },
  ]);
  const pubs = await Publication.find({
    _id: { $in: items.map((s) => s.publicationId) },
  })
    .select("title cover creatorName ownerId")
    .lean();
  const myVotes = user
    ? await Vote.find({
        challengeId,
        voterId: user.id,
        submissionId: { $in: items.map((s) => String(s._id)) },
      }).lean()
    : [];
  return {
    phase: phase(c),
    resultsFinal: phase(c) === "closed",
    items: items.map((s, i) => ({
      ...view(s),
      rank: skip + i + 1,
      voted: myVotes.some((v) => v.submissionId === String(s._id)),
      publication: pubs.find((p) => String(p._id) === s.publicationId)
        ? view(pubs.find((p) => String(p._id) === s.publicationId)!)
        : null,
      voteCount: undefined,
    })),
  };
}
export async function vote(
  request: Request,
  challengeId: string,
  user: { id: string },
) {
  await rate(`vote:${user.id}`, 30);
  const c = await Challenge.findOne({
    _id: id(challengeId),
    status: "active",
  }).lean();
  if (!c || phase(c) !== "voting") fail(409, "WINDOW", "Voting is not open.");
  const input = z
    .object({ submissionId: z.string() })
    .strict()
    .parse(await body(request));
  const s = await Submission.findOne({
    _id: id(input.submissionId),
    challengeId,
  }).lean();
  if (!s) fail(404, "NOT_FOUND", "Entry not found.");
  if (s.ownerId === user.id)
    fail(403, "SELF_VOTE", "You cannot vote for your own entry.");
  const filter = { challengeId, submissionId: String(s._id), voterId: user.id };
  if (request.method === "DELETE") await Vote.deleteOne(filter);
  else await Vote.updateOne(filter, { $setOnInsert: filter }, { upsert: true });
  return { voted: request.method !== "DELETE" };
}
