// Список разрешённых источников запросов.
// Добавьте сюда домены, с которых будет идти отправка заявок.
const ALLOWED_ORIGINS = new Set([
  "https://nikolayvorob89-dot.github.io/padel-configurator/", // ваш GitHub Pages
  "http://localhost:5173",                // локальная разработка
  "http://localhost:5189"                 // локальная разработка (vite)
]);

// Формирование заголовков CORS
function corsHeaders(origin) {
  if (ALLOWED_ORIGINS.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
  }
  return {};
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    // Preflight для CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    // Health‑check: GET /api/lead → "OK"
    if (url.pathname === "/api/lead" && request.method === "GET") {
      return new Response("OK", {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          "Content-Type": "text/plain"
        }
      });
    }

    // Любой запрос кроме POST /api/lead → 404
    if (url.pathname !== "/api/lead" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    // Проверяем, что запрос пришёл с разрешённого сайта
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    // Читаем JSON‑payload
    const payload = await request.json();

    // Объединяем дополнительные опции
    const extras = (payload?.config?.extras || [])
      .map(opt => `• ${opt.label || opt.id}`)
      .join("\n") || "—";

    // Формируем текст заявки для Telegram
    const msg =
`🟢 НОВАЯ ЗАЯВКА PADEL

👤 Имя: ${payload?.contact?.fullName || "—"}
📞 Телефон: ${payload?.contact?.phone || "—"}

🏟 Корт: ${payload?.config?.court?.label || payload?.config?.court?.id || "—"}
💡 Освещение: ${payload?.config?.lightsModel?.label || payload?.config?.lightsModel?.id || "—"}
🌤 Свет сцены: ${payload?.config?.sceneLighting?.label || payload?.config?.sceneLighting?.id || "—"}
🎨 Цвет конструкции: ${payload?.config?.structureColor ?? "Исходный"}

➕ Опции:
${extras}

🌐 ${payload?.pageUrl || "—"}
🕒 ${new Date().toLocaleString("ru-RU")}`;

    // Отправляем сообщение в Telegram
    const tgResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: msg
      })
    });
    const tgJson = await tgResponse.json();

    // Возвращаем ответ клиенту
    return new Response(JSON.stringify({ ok: true, telegram: tgJson }), {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "application/json"
      }
    });
  }
};
