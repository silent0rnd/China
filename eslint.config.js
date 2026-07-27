import js from '@eslint/js'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.agents/**'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        URL: 'readonly',
      },
    },
  },
  {
    // Сборочные скрипты выполняются в Node, а не в браузере.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
]
