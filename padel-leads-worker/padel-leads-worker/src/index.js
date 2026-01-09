const ALLOWED_ORIGINS = new Set([
  "https://nikolayvorob89-dot.github.io",
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (origin.startsWith("http://localhost:")) return true;
  if (origin.startsWith("http://127.0.0.1:")) return true;
  return ALLOWED_ORIGINS.has(origin);
}

function corsHeaders(origin) {
  if (isAllowedOrigin(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
  }
  return {};
}

function safe(v, fallback = "—") {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

function formatColor(name, hex) {
  const n = (name && String(name).trim()) ? String(name).trim() : "";
  const h = (hex && String(hex).trim()) ? String(hex).trim() : "";
  if (n && h) return `${n} (${h})`;
  if (n) return n;
  if (h) return h;
  return "—";
}

function parseDataUrl(dataUrl) {
  // data:image/jpeg;base64,xxxx
  if (!dataUrl || typeof dataUrl !== "string") return null;
  if (!dataUrl.startsWith("data:image/")) return null;

  const comma = dataUrl.indexOf(",");
  if (comma === -1) return null;

  const meta = dataUrl.slice(5, comma); // "image/jpeg;base64"
  const base64 = dataUrl.slice(comma + 1);

  const mime = meta.split(";")[0] || "image/jpeg";
  if (!meta.includes("base64")) return null;

  return { mime, base64 };
}

function base64ToBytes(base64) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function tgSendMessage(env, text) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
    }),
  });
  return r.json();
}

async function tgSendPhoto(env, { bytes, mime, caption }) {
  const ext = mime.includes("png") ? "png" : "jpg";
  const fileName = `padel.${ext}`;

  const form = new FormData();
  form.append("chat_id", env.TELEGRAM_CHAT_ID);

  // ВАЖНО: caption <= 1024
  if (caption) form.append("caption", caption.slice(0, 1000));

  form.append("photo", new Blob([bytes], { type: mime }), fileName);

  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: form,
  });

  return r.json();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    // preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // healthcheck
    if (url.pathname === "/api/lead" && request.method === "GET") {
      return new Response("OK", {
        status: 200,
        headers: { ...corsHeaders(origin), "Content-Type": "text/plain" },
      });
    }

    // only POST /api/lead
    if (url.pathname !== "/api/lead" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    if (!isAllowedOrigin(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Bad JSON", { status: 400, headers: corsHeaders(origin) });
    }

    const extras =
      (payload?.config?.extras || []).map((x) => `• ${x.label || x.id}`).join("\n") || "—";

    const structureColorText = formatColor(
      payload?.config?.structureColorName,
      payload?.config?.structureColor
    );

    const lightsColorText = formatColor(
      payload?.config?.lightsColorName,
      payload?.config?.lightsColor
    );

    const protectorsColorText = formatColor(payload?.config?.protectorsColorName, payload?.config?.protectorsColor);
    const turfColorText = formatColor(payload?.config?.turfColorName, payload?.config?.turfColor);

    const protectorsColorLine = payload?.config?.protectorsColor ? `🧩 Цвет протекторов: ${protectorsColorText}\n` : '';
    const turfColorLine = payload?.config?.turfColor ? `🌿 Цвет покрытия: ${turfColorText}\n` : '';

    const protectorsColorShortLine = payload?.config?.protectorsColor ? `🧩 Протекторы: ${protectorsColorText}\n` : '';
    const turfColorShortLine = payload?.config?.turfColor ? `🌿 Покрытие: ${turfColorText}\n` : '';

    const fullMsg =
`🟢 НОВАЯ ЗАЯВКА PADEL

👤 Имя: ${safe(payload?.contact?.fullName)}
📞 Телефон: ${safe(payload?.contact?.phone)}

🏟 Корт: ${safe(payload?.config?.court?.label || payload?.config?.court?.id)}
💡 Освещение: ${safe(payload?.config?.lightsModel?.label || payload?.config?.lightsModel?.id)}
🌤 Свет сцены: ${safe(payload?.config?.sceneLighting?.label || payload?.config?.sceneLighting?.id)}
🎨 Цвет конструкции: ${structureColorText}
🚦 Цвет стоек освещения: ${lightsColorText}
${protectorsColorLine}${turfColorLine}
➕ Опции:
${extras}

🌐 ${safe(payload?.pageUrl)}
🕒 ${new Date().toLocaleString("ru-RU")}`;

    // Короткая подпись к фото (чтобы никогда не превысить лимит)
    const shortCaption =
`🟢 НОВАЯ ЗАЯВКА PADEL
👤 ${safe(payload?.contact?.fullName)} | 📞 ${safe(payload?.contact?.phone)}
🏟 ${safe(payload?.config?.court?.label || payload?.config?.court?.id)}
${protectorsColorShortLine}${turfColorShortLine}🌐 ${safe(payload?.pageUrl)}`.slice(0, 900);

    const screenshotDataUrl = payload?.screenshotDataUrl;
    const parsed = parseDataUrl(screenshotDataUrl);

    let photoResult = null;
    let messageResult = null;

    // 1) Пытаемся отправить фото
    if (parsed) {
      try {
        const bytes = base64ToBytes(parsed.base64);

        // если вдруг огромный
        if (bytes.length > 8 * 1024 * 1024) {
          // фото слишком тяжёлое — пропустим фото и отправим только текст
          photoResult = { ok: false, description: "Screenshot too large" };
        } else {
          photoResult = await tgSendPhoto(env, {
            bytes,
            mime: parsed.mime,
            caption: shortCaption,
          });
        }
      } catch (e) {
        photoResult = { ok: false, description: String(e) };
      }
    }

    // 2) Всегда отправляем полное сообщение отдельным текстом
    // (так ты всегда получишь все детали, даже если фото не ушло)
    try {
      messageResult = await tgSendMessage(env, fullMsg);
    } catch (e) {
      messageResult = { ok: false, description: String(e) };
    }

    return new Response(JSON.stringify({
      ok: true,
      mode: photoResult?.ok ? "photo+text" : "text_only",
      photo: photoResult,
      message: messageResult,
    }), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  },
};