import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

type TaskRow = {
  id: number;
  subject: string;
  title: string;
  detail: string | null;
  completed: number;
};

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const result = await env.DB.prepare(
      `SELECT t.id, COALESCE(s.name, 'عام') AS subject, t.title,
              t.detail, t.completed
       FROM study_tasks t
       LEFT JOIN subjects s ON s.id = t.subject_id
       ORDER BY t.id DESC`
    ).all<TaskRow>();

    return Response.json({
      ok: true,
      tasks: result.results.map((task) => ({
        id: task.id,
        subject: task.subject,
        title: task.title,
        detail: task.detail ?? "",
        done: task.completed === 1,
      })),
    });
  } catch (error) {
    console.error("Tasks GET failed:", error);
    return Response.json({ ok: false, error: "تعذر تحميل المهام من قاعدة البيانات." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { subject?: string; title?: string; detail?: string };
    const subject = body.subject?.trim();
    const title = body.title?.trim();
    const detail = body.detail?.trim() || "مهمة دراسية جديدة";

    if (!subject || !title) {
      return Response.json({ ok: false, error: "المادة وعنوان المهمة مطلوبان." }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    let subjectRow = await env.DB.prepare(
      "SELECT id FROM subjects WHERE name = ? LIMIT 1"
    ).bind(subject).first<{ id: number }>();

    if (!subjectRow) {
      const insertedSubject = await env.DB.prepare(
        "INSERT INTO subjects (name, sort_order, created_at) VALUES (?, 0, ?)"
      ).bind(subject, new Date().toISOString()).run();
      subjectRow = { id: Number(insertedSubject.meta.last_row_id) };
    }

    const insertedTask = await env.DB.prepare(
      `INSERT INTO study_tasks
       (subject_id, lesson_id, title, detail, due_date, completed, created_at)
       VALUES (?, NULL, ?, ?, NULL, 0, ?)`
    ).bind(subjectRow.id, title, detail, new Date().toISOString()).run();

    return Response.json({
      ok: true,
      task: {
        id: Number(insertedTask.meta.last_row_id),
        subject,
        title,
        detail,
        done: false,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Tasks POST failed:", error);
    return Response.json({ ok: false, error: "تعذر حفظ المهمة في قاعدة البيانات." }, { status: 500 });
  }
}
