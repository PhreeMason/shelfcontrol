// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'old/*'],
  },
  {
    files: ['**/__tests__/**/*', '**/__mocks__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Additional rules to prevent scope/closure issues and improve code quality
    rules: {
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { 
        functions: false, 
        classes: true, 
        variables: false,
        ignoreTypeReferences: true
      }],
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-var': 'error',
      'no-implicit-globals': 'error',
      'react/no-unescaped-entities': 'off',
    },
  },
]);
