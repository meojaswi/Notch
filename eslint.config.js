import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  {
    ignores: ["dist/", "release/", "node_modules/", ".electron-data/"],
  },
  js.configs.recommended,
  {
    files: ["electron/**/*.js", "*.config.js"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["electron/**/*.cjs"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Existing components sync state in effects; flag it without failing CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
