import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Mobile-specific accessibility rules
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      
      // Performance rules for mobile
      "react-hooks/exhaustive-deps": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // TypeScript basic rules (no type information required)
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Test and build artifacts
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "*.config.js",
    "*.config.mjs",
  ]),
]);

export default eslintConfig;
