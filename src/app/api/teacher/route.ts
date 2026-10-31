import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `أنت المعلم الخصوصي الذكي لحسناء، طالبة السادس الابتدائي في العراق. تتحدث بالعربية العراقية الواضحة اللطيفة. ولي الأمر يرسل لك ما درسته حسناء وما يريد تدريسه. جهّز درساً منظماً موجهاً للطالبة يتضمن: عنواناً، شرحاً مبسطاً خطوة خطوة، مثالاً محلولاً، ثم 3 تمارين متدرجة دون كشف حلول التمارين. استخدم معادلات واضحة ونصاً منظماً. لا تدّع معرفة صفحات أو نصوص الكتاب حرفياً إذا لم تُعطَ لك. أعد الدرس بصيغة Markdown قابلة للعرض.`;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { message?: string; subject?: string };
    const message = body.message?.trim();
    const subject = body.subject?.trim() || "عام";
    if (!message) return Response.json({ ok: false, error: "اكتب تفاصيل الدرس أولاً." }, { status: 400 });

    const { env } = await getCloudflareContext({ async: true });
    const apiKey = (env as typeof env & { OPENAI_API_KEY?: string }).OPENAI_API_KEY;
    if (!apiKey) return Response.json({ ok: false, error: "مفتاح الذكاء الاصطناعي غير مضبوط في Cloudflare Secrets." }, { status: 503 });

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `المادة: ${subject}\nطلب ولي الأمر: ${message}\nجهّز درساً مناسباً لحسناء.` }
        ]
      })
    });
    const result = await completion.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
    if (!completion.ok) {
      console.error("OpenAI request failed:", result.error?.message);
      return Response.json({ ok: false, error: "تعذر إنشاء الدرس بالذكاء الاصطناعي. تحقق من إعداد المفتاح ورصيد API." }, { status: 502 });
    }
    const content = result.choices?.[0]?.message?.content?.trim();
    if (!content) return Response.json({ ok: false, error: "لم يصل محتوى الدرس." }, { status: 502 });

    let subjectRow = await env.DB.prepare("SELECT id FROM subjects WHERE name = ? LIMIT 1").bind(subject).first<{ id: number }>();
    if (!subjectRow) {
      const inserted = await env.DB.prepare("INSERT INTO subjects (name, sort_order, created_at) VALUES (?, 0, ?)").bind(subject, new Date().toISOString()).run();
      subjectRow = { id: Number(inserted.meta.last_row_id) };
    }
    const title = message.length > 70 ? message.slice(0, 67) + "..." : message;
    const saved = await env.DB.prepare(
      "INSERT INTO lessons (subject_id, title, description, created_at) VALUES (?, ?, ?, ?)"
    ).bind(subjectRow.id, title, content, new Date().toISOString()).run();

    return Response.json({ ok: true, lesson: { id: Number(saved.meta.last_row_id), subject, title, content } }, { status: 201 });
  } catch (error) {
    console.error("Teacher API failed:", error);
    return Response.json({ ok: false, error: "حدث خطأ أثناء تجهيز الدرس." }, { status: 500 });
  }
}
