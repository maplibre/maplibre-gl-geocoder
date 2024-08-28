import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const config = tseslint.config(
  {
    ignores: [
      '**/debug/*',
      '**/dist/*',
      '**/docs/*',
      '**/coverage/*',
      'tsconfig.json',
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    },
  }
);

export default config;