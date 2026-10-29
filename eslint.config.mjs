import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default defineConfig([
  // Files ESLint should completely ignore.
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.next/**",
      "**/out/**",
      "**/generated/**",
      "**/*.min.js",
      "**/pnpm-lock.yaml",
      "**/test/**",
    ],
  },

  // Recommended JavaScript and TypeScript rules.
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],

    extends: [js.configs.recommended, tseslint.configs.recommended],

    rules: {
      // Avoid unused variables, but allow intentional
      // unused parameters prefixed with an underscore.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Avoid silently ignoring promises.
      "@typescript-eslint/no-floating-promises": "off",

      // Keep the codebase explicit about unsafe types.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Node.js APIs for backend applications and packages.
  {
    files: [
      "apps/dashboard-api/**/*.{js,cjs,mjs,ts,cts,mts}",
      "apps/gateway-api/**/*.{js,cjs,mjs,ts,cts,mts}",
      "packages/**/*.{js,cjs,mjs,ts,cts,mts}",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Browser APIs for frontend applications.
  {
    files: [
      "apps/dashboard/**/*.{js,mjs,jsx,ts,mts,tsx}",
      "apps/checkout/**/*.{js,mjs,jsx,ts,mts,tsx}",
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Keep Prettier's formatting rules from conflicting with ESLint.
  prettier,
]);
