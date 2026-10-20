import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Las simulaciones largas comparten CPU con los recorridos de combate en CI.
    fileParallelism: false,
  },
});
