import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const config = tseslint.config(
  {
    ignores: [
      '**/debug/*',
      '**/dist/*',
      '**/docs/*',
      '**/coverage/*',
      '**/test/*',
      'tsconfig.json',
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    },
  }
);

export default config;