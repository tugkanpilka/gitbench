import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// Take a flat-config `rules` object and force every entry to 'warn' severity,
// preserving any rule options. Keeps pre-existing renderer issues from failing CI lint.
const asWarnings = (rules) =>
  Object.fromEntries(
    Object.entries(rules ?? {}).map(([name, value]) => {
      if (Array.isArray(value)) {
        return [name, ['warn', ...value.slice(1)]];
      }
      return [name, 'warn'];
    })
  );

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
              message:
                'Infrastructure implements application ports and must not depend on UI adapters.',
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
  },
  // Renderer-only react-hooks + accessibility hygiene. Pre-existing issues are warnings,
  // not errors, so they never fail CI lint — tighten to 'error' as the renderer is cleaned up.
  // eslint-plugin-react and eslint-plugin-import are intentionally omitted: their rules still
  // call pre-ESLint-10 APIs (context.getFilename / sourceCode.getTokenOrCommentAfter) and throw
  // under this project's ESLint 10. Re-add them once they ship ESLint-10-compatible releases.
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...asWarnings(reactHooks.configs.recommended.rules),
      ...asWarnings(jsxA11y.configs.recommended.rules),
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
);
