import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        // Let the frontend call /api in dev without hardcoding the backend host in each fetch.
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
