import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    const body = await request.json() as { completed?: boolean };

    if (!Number.isInteger(id) || id <= 0 || typeof body.completed !== "boolean") {
      return Response.json({ ok: false, error: "بيانات التحديث غير صحيحة." }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const result = await env.DB.prepare(
      "UPDATE study_tasks SET completed = ? WHERE id = ?"
    ).bind(body.completed ? 1 : 0, id).run();

    if (result.meta.changes === 0) {
      return Response.json({ ok: false, error: "المهمة غير موجودة." }, { status: 404 });
    }

    return Response.json({ ok: true, id, done: body.completed });
  } catch (error) {
    console.error("Tasks PATCH failed:", error);
    return Response.json({ ok: false, error: "تعذر تحديث المهمة." }, { status: 500 });
  }
}
