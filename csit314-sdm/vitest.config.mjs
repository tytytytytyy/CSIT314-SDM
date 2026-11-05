import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    // jsdom gives the tests a browser-like localStorage, which LocalStore uses.
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
  },
});
