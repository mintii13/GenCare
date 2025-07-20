import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";

export default [
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    rules: {
      // Thêm các rule tùy chỉnh ở đây nếu muốn
    },
  },
];