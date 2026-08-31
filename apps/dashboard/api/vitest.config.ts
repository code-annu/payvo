import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/src`,
    },
  },
  test: {
    name: "dashboard-api",
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["node_modules", "dist", "**/*.d.ts"],
    fileParallelism: false,
    globalSetup: "./vitest.global-setup.ts",
  },
});
