import { route } from "@/server/router";
export const runtime = "nodejs";
export const maxDuration = 120;
async function handler(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return route(request, (await context.params).path);
}
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
