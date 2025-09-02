/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    browser: {
      provider: "playwright", // or 'webdriverio'
      enabled: true,
      headless: true,
      // at least one instance is required
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      include: ["src"],
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000/api/",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ""),
      },
    },
  },
});
