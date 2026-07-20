import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The backend (server/index.ts) runs on :3000. In dev, Vite proxies the API and the
// generated-PDF static route to it, so the browser talks to one origin (no CORS).
const backend = "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/intake": backend,
      "/entitlements": backend,
      "/dossier": backend,
      "/health": backend,
      "/generated": backend
    }
  }
});
