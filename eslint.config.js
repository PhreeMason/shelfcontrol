// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'old/*'],
  },
  {
    files: ['**/__tests__/**/*', '**/__mocks__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'react/jsx-no-undef': 'error',
      'react/react-in-jsx-scope': 'error',
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
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name="getTime"]:has(NewExpression[callee.name="Date"] > MemberExpression[property.name=/^(created_at|updated_at|deadline_date|date_added|publication_date)$/])',
          message: 'Do not use new Date(serverField).getTime() for calculations. Use normalizeServerDate() from @/utils/dateNormalization instead.',
        },
        {
          selector: 'BinaryExpression:has(NewExpression[callee.name="Date"] > MemberExpression[property.name=/^(created_at|updated_at|deadline_date|date_added|publication_date)$/])',
          message: 'Do not use new Date(serverField) in comparisons. Use normalizeServerDate() from @/utils/dateNormalization instead.',
        },
      ],
    },
  },
]);
