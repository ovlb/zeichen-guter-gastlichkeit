import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import * as importX from 'eslint-plugin-import-x'
import globals from 'globals'

export default [
  // Global ignores
  {
    ignores: ['dist/', '_test-dist/', 'tmp/'],
  },

  // Base: recommended rules for all JS/TS
  eslint.configs.recommended,

  // Import validation for all files
  importX.flatConfigs.recommended,

  // Node.js files (everything except browser TS)
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.nodeBuiltin,
    },
  },

  // TypeScript (browser code in _src/assets/js/)
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['_src/assets/js/**/*.ts'],
  })),
  {
    files: ['_src/assets/js/**/*.ts'],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // TypeScript handles its own module resolution (.js → .ts for NodeNext)
      'import-x/no-unresolved': 'off',
    },
  },

  // Prettier must be last (disables conflicting rules)
  eslintConfigPrettier,
]
