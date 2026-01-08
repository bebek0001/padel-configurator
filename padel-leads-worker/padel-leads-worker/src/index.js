const ALLOWED_ORIGIN = "https://nikolayvorob89-dot.github.io";

function corsHeaders(origin) {
  if (origin === ALLOWED_ORIGIN) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
  }
  return {};
}

function safe(v, fallback = "—") {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    // preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // healthcheck
    if (url.pathname === "/api/lead" && request.method === "GET") {
      return new Response("OK", {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          "Content-Type": "text/plain",
        },
      });
    }

    // only POST /api/lead
    if (url.pathname !== "/api/lead" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    // allow only from your GitHub Pages site
    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    const payload = await request.json();

    const extras = (payload?.config?.extras || [])
      .map((x) => `• ${x.label || x.id}`)
      .join("\n") || "—";

    const structureColorHex = payload?.config?.structureColor;
    const structureColorText = structureColorHex ? safe(structureColorHex) : "Исходный";

    const lightsColorName = payload?.config?.lightsColorName;
    const lightsColorHex = payload?.config?.lightsColor;

    // выводим нормально: сначала название, потом (опционально) hex
    const lightsColorText = lightsColorName
      ? safe(lightsColorName) + (lightsColorHex ? ` (${safe(lightsColorHex)})` : "")
      : (lightsColorHex ? safe(lightsColorHex) : "—");

    const msg =
`🟢 НОВАЯ ЗАЯВКА PADEL

👤 Имя: ${safe(payload?.contact?.fullName)}
📞 Телефон: ${safe(payload?.contact?.phone)}

🏟 Корт: ${safe(payload?.config?.court?.label || payload?.config?.court?.id)}
💡 Освещение: ${safe(payload?.config?.lightsModel?.label || payload?.config?.lightsModel?.id)}
🌤 Свет сцены: ${safe(payload?.config?.sceneLighting?.label || payload?.config?.sceneLighting?.id)}
🎨 Цвет конструкции: ${structureColorText}
🚦 Цвет стоек освещения: ${lightsColorText}

➕ Опции:
${extras}

🌐 ${safe(payload?.pageUrl)}
🕒 ${new Date().toLocaleString("ru-RU")}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: msg,
      }),
    });

    const tgJson = await tgRes.json();

    return new Response(JSON.stringify({ ok: true, telegram: tgJson }), {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "application/json",
      },
    });
  },
};