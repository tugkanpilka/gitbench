import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', 'out', 'dist', 'claude-design', '.claude'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/application/**',
                '**/contracts/**',
                '**/infrastructure/**',
                '**/main/**',
                '**/preload/**',
                '**/renderer/**',
                'electron',
                'node:*',
              ],
              message: 'Domain must not depend on outer layers or runtime frameworks.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/contracts/**',
                '**/infrastructure/**',
                '**/main/**',
                '**/preload/**',
                '**/renderer/**',
                'electron',
                'node:*',
              ],
              message: 'Application may depend only on domain and framework-neutral packages.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/contracts/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/application/**',
                '**/domain/**',
                '**/infrastructure/**',
                '**/main/**',
                '**/preload/**',
                '**/renderer/**',
                'electron',
                'node:*',
              ],
              message: 'IPC contracts must remain standalone and structured-clone safe.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/infrastructure/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/contracts/**',
                '**/main/**',
                '**/preload/**',
                '**/renderer/**',
                'electron',
              ],
              message: 'Infrastructure implements application ports and must not depend on UI adapters.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/main/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/preload/**', '**/renderer/**'],
              message: 'Main must not import another Electron process entry layer.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/preload/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/application/**',
                '**/domain/**',
                '**/infrastructure/**',
                '**/main/**',
                '**/renderer/**',
                'node:*',
              ],
              message: 'Preload may depend only on Electron and IPC contracts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/application/**',
                '**/domain/**',
                '**/infrastructure/**',
                '**/main/**',
                '**/preload/**',
                'electron',
                'node:*',
              ],
              message: 'Renderer may depend only on IPC contracts and renderer-local modules.',
            },
          ],
        },
      ],
    },
  }
);
