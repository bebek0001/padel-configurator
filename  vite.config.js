import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// ВАЖНО: base нужен для GitHub Pages (repo pages).
// У тебя сайт: https://nikolayvorob89-dot.github.io/padel-configurator/
// Значит base должен быть "/padel-configurator/"
const GITHUB_PAGES_BASE = "/padel-configurator/";

// Фолбэк endpoint (если GitHub Actions не подхватил env)
const FALLBACK_LEADS_ENDPOINT =
  "https://padel-leads-worker.padel-leads.workers.dev/api/lead";

export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения (локально .env, .env.production и т.д.)
  const env = loadEnv(mode, process.cwd(), "");

  // Если в env есть VITE_LEADS_ENDPOINT — используем его.
  // Если нет (например, GitHub Actions без env) — используем FALLBACK.
  const leadsEndpoint = env.VITE_LEADS_ENDPOINT || FALLBACK_LEADS_ENDPOINT;

  return {
    plugins: [react()],
    base: GITHUB_PAGES_BASE,

    // Гарантируем, что import.meta.env.VITE_LEADS_ENDPOINT всегда определён
    define: {
      "import.meta.env.VITE_LEADS_ENDPOINT": JSON.stringify(leadsEndpoint)
    }
  };
});