import { getCloudflareContext } from "@opennextjs/cloudflare";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const rows = await env.DB.prepare(
      `SELECT l.id, l.title, l.description AS content, l.created_at,
              COALESCE(s.name, 'عام') AS subject
       FROM lessons l LEFT JOIN subjects s ON s.id = l.subject_id
       ORDER BY l.id DESC LIMIT 50`
    ).all<{id:number;title:string;content:string;created_at:string;subject:string}>();
    return Response.json({ ok: true, lessons: rows.results });
  } catch (error) {
    console.error("Lessons GET failed:", error);
    return Response.json({ ok: false, error: "تعذر تحميل الدروس." }, { status: 500 });
  }
}
