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
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-utils': ['@tanstack/react-query', 'lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['@xyflow/react', 'recharts']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
