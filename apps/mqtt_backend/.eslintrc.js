/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/base.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["jest"],
  overrides: [
    {
      files: ["tests/**/*"],
      plugins: ["jest"],
      extends: ["plugin:jest/recommended"],
      rules: { "jest/prefer-expect-assertions": "off" },
    },
  ],
  env: {
    "jest/globals": true,
  },
  rules: {
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "warn",
    "jest/valid-expect": "error",
  },
};
