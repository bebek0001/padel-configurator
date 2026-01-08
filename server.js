import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// временно для примера
const TELEGRAM_BOT_TOKEN = "8488598869:AAFvkx9ofxue-hKX0XnJx8tOSYdBah-IJZU";
const TELEGRAM_CHAT_ID = "450096315";

// ✅ ПРОВЕРКА: сервер жив
app.get("/api/lead", (req, res) => {
  res.status(200).send("OK");
});

// ✅ основной маршрут
app.post("/api/lead", async (req, res) => {
  const payload = req.body;

  try {
    const extras = (payload?.config?.extras || [])
      .map(x => `• ${x.label || x.id}`)
      .join("\n") || "—";

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

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: msg
      })
    });

    const tgJson = await tgRes.json();

    // ✅ важно: всегда отвечаем фронту, чтобы не висло "Отправка..."
    res.status(200).json({ ok: true, telegram: tgJson });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.listen(3000, () => {
  console.log("SERVER STARTED → http://localhost:3000");
  console.log("HEALTHCHECK → http://localhost:3000/api/lead");
});
