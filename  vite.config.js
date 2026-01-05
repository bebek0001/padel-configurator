import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // ВАЖНО для GitHub Pages проекта (репо) — базовый путь = имя репозитория
  base: "/padel-configurator/",
});
