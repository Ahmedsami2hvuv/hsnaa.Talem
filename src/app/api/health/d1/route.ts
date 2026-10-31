import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all<{ name: string }>();

    return Response.json({
      ok: true,
      database: "hsnaa-db",
      tables: result.results.map((row) => row.name),
    });
  } catch (error) {
    console.error("D1 health check failed:", error);
    return Response.json(
      { ok: false, error: "تعذر الاتصال بقاعدة البيانات حالياً." },
      { status: 503 }
    );
  }
}
