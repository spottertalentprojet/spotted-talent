import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("/react/") ||
            id.includes("\\react\\") ||
            id.includes("react-dom") ||
            id.includes("scheduler")
          ) {
            return "react-vendor";
          }

          if (id.includes("react-router-dom")) {
            return "router";
          }

          if (id.includes("@supabase")) {
            return "supabase";
          }

          if (id.includes("@tanstack/react-query")) {
            return "query";
          }

          if (
            id.includes("@radix-ui") ||
            id.includes("lucide-react") ||
            id.includes("cmdk") ||
            id.includes("vaul") ||
            id.includes("input-otp") ||
            id.includes("class-variance-authority") ||
            id.includes("clsx") ||
            id.includes("tailwind-merge")
          ) {
            return "ui";
          }

          if (id.includes("framer-motion") || id.includes("embla-carousel-react")) {
            return "motion";
          }

          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform/resolvers") ||
            id.includes("zod")
          ) {
            return "forms";
          }

          if (id.includes("recharts")) {
            return "charts";
          }

          if (id.includes("html2canvas")) {
            return "html2canvas";
          }

          if (id.includes("jspdf")) {
            return "jspdf";
          }

          if (id.includes("dompurify") || id.includes("purify.es")) {
            return "dompurify";
          }
        },
      },
    },
  },
}));
