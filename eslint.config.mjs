import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    // As fixtures do Playwright recebem um callback `use(valor)`. A regra de
    // hooks do React lê isso como o hook `use` chamado fora de componente.
    files: ["tests/e2e/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
]);

export default eslintConfig;
