import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";

export default [
  {
    ignores: ["dist/**", "**/*.js"],
  },
  { languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
  pluginReactConfig,
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
    }
  }
]; 