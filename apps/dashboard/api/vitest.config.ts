import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    fileParallelism: false,

    environment: "node",

    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    exclude: ["node_modules", "dist"],

    coverage: {
      reporter: ["text", "html"],
      include: ["src/**/*.ts", "test/**/*.ts"],
    },
  },
});
