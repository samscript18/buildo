import "server-only";
import { dashboard } from "./dashboard";
import { db } from "./db";
import { identity, getAuth, optionalIdentity } from "./auth";
import { errorResponse, fail } from "./errors";
import { origin, id } from "./http";
import { projectCollection, projectItem, publish, designs } from "./projects";
import {
  generationCollection,
  generationItem,
  retryGenerationTransfer,
} from "./generations";
import { assets, allowAssetRemix } from "./assets";
import { challenges, submissions, vote } from "./challenges";
import { Publication } from "./models";
import { designSummary } from "./community-preview";
import { ObjectId } from "mongodb";
export async function route(request: Request, path: string[]) {
  try {
    const [group, key, action] = path;
    const method = request.method;
    const allowed = (methods: string[]) => {
      if (!methods.includes(method)) fail(405, "METHOD", "Method not allowed.");
    };
    if (group === "config" && path.length === 1) {
      allowed(["GET"]);
      return Response.json({
        accounts: !!(
          process.env.MONGODB_URI &&
          process.env.BETTER_AUTH_SECRET &&
          process.env.BETTER_AUTH_URL
        ),
        storage: !!(
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        ),
        generation: !!(
          process.env.LUX3D_API_KEY &&
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        ),
        googleAuth: !!(
          process.env.GOOGLE_CLIENT_ID &&
          process.env.GOOGLE_CLIENT_SECRET &&
          process.env.MONGODB_URI &&
          process.env.BETTER_AUTH_SECRET &&
          process.env.BETTER_AUTH_URL
        ),
        environmentGeneration: false,
      });
    }
    if (path.length > 3) fail(404, "NOT_FOUND", "Route not found.");
    origin(request);
    await db();
    let result: unknown;
    if (group === "dashboard" && !key) {
      allowed(["GET"]);
      result = await dashboard(await identity(request));
    } else if (group === "settings" && !key) {
      allowed(["GET"]);
      const user = await identity(request);
      const native = (await db()).connection.db!;
      const profile = await native
        .collection("user")
        .findOne(
          { _id: new ObjectId(user.id) },
          { projection: { name: 1, email: 1, createdAt: 1 } },
        );
      const userFilter = { $in: [user.id, new ObjectId(user.id)] };
      const accounts = await native
        .collection("account")
        .find({ userId: userFilter }, { projection: { providerId: 1 } })
        .limit(10)
        .toArray();
      const sessions = await native
        .collection("session")
        .find(
          { userId: userFilter, expiresAt: { $gt: new Date() } },
          { projection: { createdAt: 1, expiresAt: 1 } },
        )
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
      result = {
        ...user,
        email: profile?.email,
        createdAt: profile?.createdAt,
        providers: accounts.map((a) => a.providerId),
        sessions: sessions.map((s) => ({
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
        })),
      };
    } else if (group === "projects") {
      const user = await identity(request);
      if (!key) {
        allowed(["GET", "POST"]);
        result = await projectCollection(request, user);
      } else if (action === "publish") {
        allowed(["POST"]);
        result = await publish(request, key, user);
      } else if (!action) {
        allowed(["GET", "PATCH", "DELETE"]);
        result = await projectItem(request, key, user);
      } else fail(404, "NOT_FOUND", "Route not found.");
    } else if (group === "assets" && key && action === "allow-remix") {
      allowed(["POST"]);
      result = await allowAssetRemix(request, key, await identity(request));
    } else if (group === "assets" && !key) {
      allowed(["GET", "POST"]);
      result = await assets(request, await identity(request));
    } else if (group === "generations" && action === "retry-transfer" && key) {
      allowed(["POST"]);
      result = await retryGenerationTransfer(key, await identity(request));
    } else if (group === "generations" && !action) {
      const user = await identity(request);
      allowed(key ? ["GET"] : ["GET", "POST"]);
      result = key
        ? await generationItem(key, user)
        : await generationCollection(request, user);
    } else if (group === "designs") {
      allowed(action === "remix" ? ["POST"] : ["GET"]);
      if (action && action !== "remix")
        fail(404, "NOT_FOUND", "Route not found.");
      result = await designs(
        request,
        key,
        action === "remix" ? await identity(request) : undefined,
        action === "remix" ? undefined : await optionalIdentity(request),
      );
    } else if (group === "challenges") {
      if (action === "submissions") {
        allowed(["GET", "POST"]);
        const user = await identity(request);
        result = await submissions(request, key, user);
      } else if (action === "votes") {
        allowed(["POST", "DELETE"]);
        result = await vote(request, key, await identity(request));
      } else if (!action) {
        allowed(key ? ["GET", "PATCH"] : ["GET", "POST"]);
        const user =
          method !== "GET" ||
          new URL(request.url).searchParams.get("admin") === "true"
            ? await identity(request)
            : await optionalIdentity(request);
        result = await challenges(request, key, user);
      } else fail(404, "NOT_FOUND", "Route not found.");
    } else if (group === "creators" && key && !action) {
      allowed(["GET"]);
      id(key);
      const connection = await db();
      const u = await connection.connection
        .db!.collection("user")
        .findOne({ _id: new ObjectId(key) }, { projection: { name: 1 } });
      if (!u) fail(404, "NOT_FOUND", "Creator not found.");
      const viewer = await optionalIdentity(request);
      result = {
        id: key,
        name: u.name,
        preview: !viewer,
        items: (
          await Publication.find({ ownerId: key })
            .select(
              "title category creatorName ownerId allowRemix cover description publishedAt",
            )
            .sort({ publishedAt: -1 })
            .limit(viewer ? 24 : 3)
            .lean()
        ).map((p) => designSummary(p, !viewer)),
      };
    } else if (group === "me" && !key) {
      allowed(["GET"]);
      const u = await identity(request);
      result = u;
    } else fail(404, "NOT_FOUND", "Route not found.");
    return Response.json(result, {
      headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function authRoute(request: Request) {
  try {
    await db();
    return await getAuth().handler(request);
  } catch (e) {
    return errorResponse(e);
  }
}
