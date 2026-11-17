import "server-only";
import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import type { Scene } from "@/lib/scene";
const options = { timestamps: true };
const projectSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    title: String,
    category: String,
    brief: String,
    scene: { type: Schema.Types.Mixed, required: true },
    revision: { type: Number, default: 0 },
    schemaVersion: { type: Number, default: 1 },
    deletedAt: Date,
    challengeId: String,
    templateVersion: String,
    originalId: String,
    rootId: String,
  },
  options,
);
const assetSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    name: String,
    source: String,
    sourceUrl: String,
    taskId: String,
    prompt: String,
    allowReuse: { type: Boolean, default: false },
    rightsConfirmed: Boolean,
    secureUrl: String,
    publicId: String,
    resourceType: String,
    format: String,
    bytes: Number,
    vertices: Number,
    texturePixels: Number,
    sha256: String,
    bounds: Schema.Types.Mixed,
    normalization: Schema.Types.Mixed,
    status: { type: String, default: "ready" },
    generationId: { type: String, index: { unique: true, sparse: true } },
  },
  options,
);
const jobSchema = new Schema(
  {
    ownerId: { type: String, required: true },
    projectId: String,
    prompt: String,
    style: String,
    requestKey: String,
    requestHash: String,
    allowReuse: Boolean,
    providerTaskId: { type: String, index: { unique: true, sparse: true } },
    state: String,
    attempts: { type: Number, default: 0 },
    safeError: String,
    outputHost: String,
    leaseUntil: Date,
    nextPollAt: Date,
    assetId: String,
    activeSlot: String,
    stage: String,
    transferAttempts: { type: Number, default: 0 },
    recoveryFailures: { type: Number, default: 0 },
    failure: Schema.Types.Mixed,
    failureHistory: [Schema.Types.Mixed],
    transferCheckpoint: Schema.Types.Mixed,
    leaseToken: String,
  },
  options,
);
jobSchema.index({ ownerId: 1, requestKey: 1 }, { unique: true });
jobSchema.index({ state: 1, nextPollAt: 1, leaseUntil: 1 });
jobSchema.index(
  { ownerId: 1, activeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { activeSlot: { $type: "string" } },
  },
);
const publicationSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    creatorName: String,
    projectId: String,
    title: String,
    category: String,
    scene: Schema.Types.Mixed,
    revision: Number,
    description: String,
    allowRemix: Boolean,
    originalId: String,
    rootId: String,
    cover: String,
    challengeId: String,
    templateVersion: String,
    publishedAt: { type: Date, default: Date.now },
  },
  options,
);
publicationSchema.index({ publishedAt: -1 });
const challengeSchema = new Schema(
  {
    title: String,
    theme: String,
    rules: String,
    room: Schema.Types.Mixed,
    templateVersion: String,
    opensAt: Date,
    submissionsCloseAt: Date,
    votingCloseAt: Date,
    status: { type: String, default: "draft" },
    createdBy: String,
  },
  options,
);
const submissionSchema = new Schema(
  {
    challengeId: String,
    ownerId: String,
    publicationId: String,
    submittedAt: { type: Date, default: Date.now },
  },
  options,
);
submissionSchema.index({ challengeId: 1, ownerId: 1 }, { unique: true });
const voteSchema = new Schema(
  { challengeId: String, submissionId: String, voterId: String },
  options,
);
voteSchema.index(
  { challengeId: 1, submissionId: 1, voterId: 1 },
  { unique: true },
);
const rateSchema = new Schema({ _id: String, count: Number, expiresAt: Date });
rateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
type Base = { _id: unknown; createdAt: Date; updatedAt: Date };
export interface ProjectRecord extends Base {
  ownerId: string;
  title: string;
  category: string;
  brief?: string;
  scene: Scene;
  revision: number;
  schemaVersion: number;
  deletedAt?: Date;
  challengeId?: string;
  templateVersion?: string;
  originalId?: string;
  rootId?: string;
}
export interface AssetRecord extends Base {
  ownerId: string;
  name: string;
  source: string;
  sourceUrl: string;
  taskId?: string;
  prompt?: string;
  allowReuse: boolean;
  rightsConfirmed: boolean;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  vertices: number;
  texturePixels: number;
  sha256: string;
  bounds: unknown;
  normalization: { scale: number; offset: [number, number, number] };
  status: string;
  generationId?: string;
}
export interface JobRecord extends Base {
  ownerId: string;
  projectId: string;
  prompt: string;
  style: string;
  requestKey: string;
  requestHash: string;
  allowReuse?: boolean;
  providerTaskId?: string;
  state: string;
  attempts: number;
  safeError?: string;
  outputHost?: string;
  leaseUntil?: Date;
  nextPollAt?: Date;
  assetId?: string;
  activeSlot?: string;
  stage?: import("./generation-failures").TransferStage;
  transferAttempts: number;
  recoveryFailures: number;
  failure?: {
    code: string;
    stage: string;
    retryable: boolean;
    at: Date;
    reference: string;
  };
  failureHistory?: JobRecord["failure"][];
  transferCheckpoint?: Awaited<
    ReturnType<typeof import("./storage").uploadModel>
  >;
  leaseToken?: string;
}
export interface PublicationRecord extends Base {
  ownerId: string;
  creatorName: string;
  projectId: string;
  title: string;
  category: string;
  scene: Scene;
  revision: number;
  description: string;
  allowRemix: boolean;
  originalId?: string;
  rootId?: string;
  cover?: string;
  challengeId?: string;
  templateVersion?: string;
  publishedAt: Date;
}
export interface ChallengeRecord extends Base {
  title: string;
  theme: string;
  rules: string;
  room: Scene["room"];
  templateVersion: string;
  opensAt: Date;
  submissionsCloseAt: Date;
  votingCloseAt: Date;
  status: string;
  createdBy: string;
}
export interface SubmissionRecord extends Base {
  challengeId: string;
  ownerId: string;
  publicationId: string;
  submittedAt: Date;
}
export const Project =
  (models.Project as import("mongoose").Model<ProjectRecord>) ||
  model<ProjectRecord>("Project", projectSchema);
export const Asset =
  (models.Asset as import("mongoose").Model<AssetRecord>) ||
  model<AssetRecord>("Asset", assetSchema);
export const Job =
  (models.GenerationJob as import("mongoose").Model<JobRecord>) ||
  model<JobRecord>("GenerationJob", jobSchema);
export const Publication =
  (models.Publication as import("mongoose").Model<PublicationRecord>) ||
  model<PublicationRecord>("Publication", publicationSchema);
export const Challenge =
  (models.Challenge as import("mongoose").Model<ChallengeRecord>) ||
  model<ChallengeRecord>("Challenge", challengeSchema);
export const Submission =
  (models.Submission as import("mongoose").Model<SubmissionRecord>) ||
  model<SubmissionRecord>("Submission", submissionSchema);
export const Vote =
  (models.Vote as import("mongoose").Model<{
    challengeId: string;
    submissionId: string;
    voterId: string;
  }>) || model("Vote", voteSchema);
export const Rate =
  (models.Rate as import("mongoose").Model<{
    _id: string;
    count: number;
    expiresAt: Date;
  }>) || model("Rate", rateSchema);
export const allModels = [
  Project,
  Asset,
  Job,
  Publication,
  Challenge,
  Submission,
  Vote,
  Rate,
];
export function serialize<T>(value: T) {
  return JSON.parse(
    JSON.stringify(value, (key, v) => (key === "_id" ? String(v) : v)),
  );
}
export function view<T extends { _id: unknown }>(doc: T) {
  return {
    ...serialize(doc),
    id: String(doc._id),
    _id: undefined,
    __v: undefined,
  };
}
