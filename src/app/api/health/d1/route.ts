import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"
    ).all<{ name: string }>();

    const tables = await Promise.all(
      result.results.map(async ({ name }) => {
        const columns = await env.DB.prepare(`PRAGMA table_info("${name.replace(/"/g, '""')}")`).all<{
          name: string;
          type: string;
          notnull: number;
          pk: number;
        }>();
        return {
          name,
          columns: columns.results.map((column) => ({
            name: column.name,
            type: column.type,
            required: column.notnull === 1,
            primaryKey: column.pk === 1,
          })),
        };
      })
    );

    return Response.json({
      ok: true,
      database: "hsnaa-db",
      tables,
    });
  } catch (error) {
    console.error("D1 health check failed:", error);
    return Response.json(
      { ok: false, error: "تعذر الاتصال بقاعدة البيانات حالياً." },
      { status: 503 }
    );
  }
}
