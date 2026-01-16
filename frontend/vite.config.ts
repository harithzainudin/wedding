import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: "/wedding",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/vue") || id.includes("node_modules/@vue") || id.includes("node_modules/vue-router")) {
            return "vendor-vue";
          }
          if (id.includes("node_modules/leaflet")) {
            return "vendor-leaflet";
          }
          if (id.includes("node_modules/vuedraggable") || id.includes("node_modules/sortablejs")) {
            return "vendor-draggable";
          }
          if (id.includes("node_modules/qrcode")) {
            return "vendor-qrcode";
          }
        },
      },
    },
  },
});
