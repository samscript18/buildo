export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = Record<string, unknown>>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Unable to connect. Check your connection and try again.",
      "NETWORK",
      0,
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      "This service is temporarily unavailable. Please retry.",
      "UNAVAILABLE",
      response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(
      data.error?.message || "Something went wrong.",
      data.error?.code || "REQUEST_FAILED",
      response.status,
    );
  return data;
}
export function post<T = Record<string, unknown>>(
  path: string,
  data: unknown,
  method = "POST",
) {
  return api<T>(path, { method, body: JSON.stringify(data) });
}
