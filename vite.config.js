import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// On GitHub Pages a project site is served from https://<user>.github.io/<repo>/,
// so the app must be built with base = "/<repo>/". The deploy workflow passes
// this automatically via `--base`; locally it defaults to "/".
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // we call registerSW() ourselves in src/main.jsx
      includeAssets: ["icons/apple-touch-icon.png", "icons/favicon-32.png"],
      manifest: {
        name: "The Craig Protocol",
        short_name: "Craig",
        description:
          "Kettlebell strength, fuel logging and an AI coach — your home fitness protocol.",
        theme_color: "#0A1826",
        background_color: "#0A1826",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Don't precache the API; cache the app shell for offline launch.
        navigateFallbackDenylist: [/^https:\/\/api\.anthropic\.com/],
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
      },
    }),
  ],
});
