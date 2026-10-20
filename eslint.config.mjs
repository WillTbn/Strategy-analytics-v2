import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier";

// Preserve the previous Vue essential checks with ESLint 9's flat configuration.
export default [
  {
    ignores: [
      "node_modules/**", "dist/**", ".quasar/**", ".git/**",
      "src-capacitor/**", "src-cordova/**", "quasar.config.*.temporary.compiled*",
    ],
  },
  ...pluginVue.configs["flat/essential"],
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "prefer-promise-reject-errors": "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    },
  },
  prettier,
];
