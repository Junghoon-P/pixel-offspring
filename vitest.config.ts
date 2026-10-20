import { defineConfig } from "vitest/config";
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "worker/**/*.test.ts"],
    coverage: {
      provider: "v8",
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}", "worker/**/*.ts"],
      exclude: ["**/*.test.{ts,tsx}", "**/model.ts", "**/types.ts"],
    },
  },
});
