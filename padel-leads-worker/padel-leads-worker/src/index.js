function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);

    // GitHub Pages
    if (u.hostname.endsWith(".github.io")) return true;

    // Local dev
    if (u.hostname === "localhost") return true;

    return false;
  } catch {
    return false;
  }
}

function makeCors(origin) {
  if (!isAllowedOrigin(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function safeStr(x) {
  if (x == null) return "—";
  const s = String(x).trim();
  return s ? s : "—";
}

function buildMessage(payload) {
  const extras = (payload?.config?.extras || [])
    .map(x => `• ${x.label || x.id}`)
    .join("\n") || "—";

  return (
`🟢 НОВАЯ ЗАЯВКА PADEL

👤 Имя: ${safeStr(payload?.contact?.fullName)}
📞 Телефон: ${safeStr(payload?.contact?.phone)}

🏟 Корт: ${safeStr(payload?.config?.court?.label || payload?.config?.court?.id)}
💡 Освещение: ${safeStr(payload?.config?.lightsModel?.label || payload?.config?.lightsModel?.id)}
🌤 Свет сцены: ${safeStr(payload?.config?.sceneLighting?.label || payload?.config?.sceneLighting?.id)}
🎨 Цвет конструкции: ${safeStr(payload?.config?.structureColor ?? "Исходный")}

➕ Опции:
${extras}

🌐 ${safeStr(payload?.pageUrl)}
🕒 ${new Date().toLocaleString("ru-RU")}`
  );
}

// "data:image/png;base64,AAAA..." -> { mime, bytes(Uint8Array) }
function dataUrlToBytes(dataUrl) {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(dataUrl || "");
  if (!m) return null;
  const mime = m[1];
  const b64 = m[2];

  const binStr = atob(b64);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
  return { mime, bytes };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...makeCors(origin) } });
    }

    // Healthcheck
    if (request.method === "GET" && url.pathname === "/api/lead") {
      return new Response("OK", {
        status: 200,
        headers: { ...makeCors(origin), "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Only POST /api/lead
    if (request.method !== "POST" || url.pathname !== "/api/lead") {
      return new Response("Not found", { status: 404 });
    }

    // CORS gate
    if (!isAllowedOrigin(origin)) {
      return new Response("Forbidden (CORS)", { status: 403 });
    }

    // Check secrets
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return new Response("Server misconfigured: missing TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID", {
        status: 500,
        headers: { ...makeCors(origin), "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Parse JSON
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Bad JSON", { status: 400, headers: makeCors(origin) });
    }

    const msg = buildMessage(payload);

    const screenshot = payload?.screenshotBase64;
    const hasScreenshot = typeof screenshot === "string" && screenshot.startsWith("data:image/");

    // If we have screenshot -> sendPhoto (reliable: multipart with Blob)
    if (hasScreenshot) {
      const parsed = dataUrlToBytes(screenshot);
      if (!parsed) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid screenshotBase64" }), {
          status: 400,
          headers: { ...makeCors(origin), "Content-Type": "application/json" }
        });
      }

      const { mime, bytes } = parsed;
      const ext = mime.includes("png") ? "png" : (mime.includes("jpeg") ? "jpg" : "img");
      const fileName = `padel-lead.${ext}`;

      const form = new FormData();
      form.append("chat_id", env.TELEGRAM_CHAT_ID);
      // caption ограничен ~1024, аккуратно обрезаем
      form.append("caption", msg.slice(0, 1000));
      form.append("photo", new Blob([bytes], { type: mime }), fileName);

      const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        body: form
      });

      const tgJson = await tgRes.json();

      return new Response(JSON.stringify({ ok: true, telegram: tgJson }), {
        status: 200,
        headers: { ...makeCors(origin), "Content-Type": "application/json" }
      });
    }

    // else -> sendMessage
    const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: msg
      })
    });

    const tgJson = await tgRes.json();

    return new Response(JSON.stringify({ ok: true, telegram: tgJson }), {
      status: 200,
      headers: { ...makeCors(origin), "Content-Type": "application/json" }
    });
  }
};