import "server-only";
import { Project, Asset, Publication, Job, view } from "./models";
export async function dashboard(user: { id: string }) {
  const owned = { ownerId: user.id };
  const activeStates = ["queued", "generating", "transferring"];
  const attentionStates = ["unknown", "timed_out", "transfer_failed", "failed"];
  const [
    projectCount,
    assetCount,
    publicationCount,
    activeGenerations,
    attentionGenerations,
    recentProject,
    jobs,
  ] = await Promise.all([
    Project.countDocuments({ ...owned, deletedAt: null }),
    Asset.countDocuments({ ...owned, status: "ready" }),
    Publication.countDocuments(owned),
    Job.countDocuments({ ...owned, state: { $in: activeStates } }),
    Job.countDocuments({ ...owned, state: { $in: attentionStates } }),
    Project.findOne({ ...owned, deletedAt: null })
      .sort({ updatedAt: -1 })
      .lean(),
    Job.aggregate([
      { $match: owned },
      {
        $addFields: {
          priority: {
            $switch: {
              branches: [
                { case: { $in: ["$state", activeStates] }, then: 0 },
                { case: { $in: ["$state", attentionStates] }, then: 1 },
              ],
              default: 2,
            },
          },
        },
      },
      { $sort: { priority: 1, updatedAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          prompt: 1,
          state: 1,
          projectId: 1,
          safeError: 1,
          updatedAt: 1,
          createdAt: 1,
          assetId: 1,
        },
      },
    ]),
  ]);
  return {
    counts: {
      projects: projectCount,
      assets: assetCount,
      publications: publicationCount,
      activeGenerations,
      attentionGenerations,
    },
    recentProject: recentProject ? view(recentProject) : null,
    jobs: jobs.map(view),
  };
}
