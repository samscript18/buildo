import { db } from "@/server/db";
export const runtime = "nodejs";
export async function GET() {
  try {
    const connection = await db();
    await connection.connection.db!.command({ ping: 1 });
    return Response.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
