import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                // Match the TS config so local dev can forward API calls to Flask.
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
            },
        },
    },
});
