import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**"] },
  js.configs.recommended,
  {
    // Browser game source (ES modules running in the browser).
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
    },
  },
  {
    // Service worker: classic script with worker globals.
    files: ["sw.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: { ...globals.browser, ...globals.serviceworker },
    },
  },
  {
    // Tooling and tests run under Node.
    files: ["scripts/**/*.mjs", "test/**/*.mjs", "eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
  {
    rules: {
      // Keep dead variables/imports flagged, but allow intentionally unused
      // function parameters (common for fixed callback/update signatures).
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
    },
  },
];
