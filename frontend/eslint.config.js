import globals from "globals";

export default [
  {
    files: ["public/js/**/*.js", "tests/**/*.js"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "no-undef": "error",
      "no-unused-vars": [
        "error",
        { caughtErrors: "none", argsIgnorePattern: "^_" },
      ],
    },
  },
];
