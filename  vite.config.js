import { defineConfig } from 'vite'

export default defineConfig(({ command }) => {
  // Для GitHub Pages (project repo): /<repo>/
  // В dev должен быть корень /
  return {
    base: command === 'build' ? '/padel-configurator/' : '/',
  }
})
