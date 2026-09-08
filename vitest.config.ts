import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Deno owns the gateway tests (supabase/functions/**); they run against the
    // same runtime they deploy to, via `npm run test:gateway`.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
});
