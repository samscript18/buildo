import { ZodError } from "zod";
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function fail(status: number, code: string, message: string): never {
  throw new AppError(status, code, message);
}
export function errorResponse(error: unknown) {
  const requestId = crypto.randomUUID();
  if (error instanceof ZodError)
    return Response.json(
      {
        error: {
          code: "VALIDATION",
          message: "Please check the supplied information.",
          fields: error.flatten(),
          requestId,
        },
      },
      { status: 400 },
    );
  if (error instanceof AppError)
    return Response.json(
      { error: { code: error.code, message: error.message, requestId } },
      { status: error.status },
    );
  if (
    typeof error === "object" &&
    error &&
    "code" in error &&
    error.code === 11000
  )
    return Response.json(
      {
        error: {
          code: "DUPLICATE",
          message: "This action has already been recorded.",
          requestId,
        },
      },
      { status: 409 },
    );
  console.error("Request failed", {
    requestId,
    type: error instanceof Error ? error.name : "Unknown",
  });
  return Response.json(
    {
      error: {
        code: "UNAVAILABLE",
        message: "This service is temporarily unavailable. Please retry.",
        requestId,
      },
    },
    { status: 503 },
  );
}
export function configured(name: string) {
  const value = process.env[name];
  if (!value)
    fail(
      503,
      "NOT_CONFIGURED",
      "This feature is being set up. Please try again later.",
    );
  return value;
}
