import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    // jsdom gives the tests a browser-like localStorage, which LocalStore uses.
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
