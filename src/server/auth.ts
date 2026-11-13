import "server-only";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { validNewPassword } from "@/lib/password";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { configured, fail } from "./errors";
const state = globalThis as typeof globalThis & {
  buildoAuth?: ReturnType<typeof createAuth>;
};
function createAuth() {
  const client = new MongoClient(configured("MONGODB_URI"), {
    serverSelectionTimeoutMS: 5000,
  });
  return betterAuth({
    database: mongodbAdapter(client.db()),
    secret: configured("BETTER_AUTH_SECRET"),
    baseURL: configured("BETTER_AUTH_URL"),
    socialProviders:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              prompt: "select_account",
            },
          }
        : {},
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email") {
          const password = ctx.body?.password;
          if (typeof password !== "string" || !validNewPassword(password))
            throw new APIError("BAD_REQUEST", {
              message:
                "Use 10–128 characters with a lowercase letter, an uppercase letter, a number and a symbol.",
            });
        }
      }),
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "user", input: false },
      },
    },
  });
}
export function getAuth() {
  return (state.buildoAuth ??= createAuth());
}
export async function identity(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) fail(401, "UNAUTHENTICATED", "Sign in to continue.");
  return {
    id: session.user.id,
    name: session.user.name,
    role:
      (session.user as typeof session.user & { role?: string }).role ?? "user",
  };
}

export async function optionalIdentity(request: Request) {
  if (
    !process.env.MONGODB_URI ||
    !process.env.BETTER_AUTH_SECRET ||
    !process.env.BETTER_AUTH_URL
  )
    return undefined;
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return undefined;
  return {
    id: session.user.id,
    name: session.user.name,
    role:
      (session.user as typeof session.user & { role?: string }).role ?? "user",
  };
}
