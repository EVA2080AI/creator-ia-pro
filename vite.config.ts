import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // En local, las funciones de /api/* las sirve `vercel dev` en otro puerto
    // (vercel dev no proxea bien los módulos de Vite si sirve el frontend él mismo).
    // En producción esto no aplica: Vercel sirve el build estático + funciones en el mismo dominio.
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000
  }
});
