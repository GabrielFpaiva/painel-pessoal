import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    projects: [
      {
        // Lógica pura de `src/domain/` e validações. Roda sem nada no ar.
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        // Fala com o Supabase local. Precisa de `supabase start`.
        extends: true,
        test: {
          name: "rls",
          include: ["tests/rls/**/*.test.ts"],
          testTimeout: 30_000,
          hookTimeout: 60_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
