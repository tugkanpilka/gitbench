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
  { ignores: ['node_modules', 'out', 'dist', 'coverage', 'build', 'claude-design', '.claude', 'ClaudeSetup'] },
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
  // ── Code Quality Kit: the DETERMINISTIC FLOOR ───────────────────────────────
  // Owns the things an LLM counts badly (sizes, nesting, switch, barrels,
  // I-prefix). The architecture-reviewer / craft-reviewer agents sit on top and
  // are told NOT to re-report anything caught here. Added at 'error' on purpose:
  // there is a known backlog of pre-existing violations to clean up over time.
  {
    rules: {
      // ── Size limits (hard caps) ──────────────────────────────────────────
      // NOTE: 15 lines applies to React components too — JSX-heavy components
      // trip this constantly. By design (extract subcomponents); if too tight,
      // see the *.tsx override at the bottom of this file.
      'max-lines-per-function': ['error', { max: 15, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 3],

      // ── Control-flow shape: nudge toward guard clauses / early return ─────
      'no-else-return': ['error', { allowElseIf: false }],
      'no-lonely-if': 'error',

      // ── Naming: no `I` prefix on interfaces (context comes from the folder)
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: false } },
        // Optionally also ban Dto/Service/Impl suffixes — left off because it
        // false-positives on legitimately-named types. Uncomment to enforce:
        // { selector: ['class', 'interface', 'typeAlias'], format: ['PascalCase'],
        //   custom: { regex: '(Dto|Impl)$', match: false } },
      ],

      // ── Idiom: don't annotate what's trivially inferred ──────────────────
      '@typescript-eslint/no-inferrable-types': 'error',

      // ── Structural bans via AST selectors ────────────────────────────────
      'no-restricted-syntax': [
        'error',
        // >3 params on any function / arrow / method, EXCEPT constructors
        {
          selector: 'FunctionDeclaration[params.length>3]',
          message: 'More than 3 parameters — use a named options object (its own file).',
        },
        {
          selector: 'ArrowFunctionExpression[params.length>3]',
          message: 'More than 3 parameters — use a named options object (its own file).',
        },
        {
          selector:
            "FunctionExpression[params.length>3]:not(MethodDefinition[kind='constructor'] > FunctionExpression)",
          message: 'More than 3 parameters — use a named options object (its own file).',
        },
        // >5 params on a constructor
        {
          selector: "MethodDefinition[kind='constructor'] > FunctionExpression[params.length>5]",
          message: 'Constructor takes more than 5 dependencies — it is doing too much.',
        },
        // No nested loops, ever (a loop anywhere inside another loop).
        {
          selector:
            ':matches(ForStatement, ForInStatement, ForOfStatement, WhileStatement, DoWhileStatement) :matches(ForStatement, ForInStatement, ForOfStatement, WhileStatement, DoWhileStatement)',
          message: 'No nested loops — extract a function or restructure the data.',
        },
        // switch is discouraged (project default). Delete this one entry to allow
        // exhaustive switch at boundaries; otherwise use polymorphism, or a guard
        // chain ending in assertNever() for closed unions.
        {
          selector: 'SwitchStatement',
          message:
            'switch is discouraged — prefer polymorphism, or guards ending in assertNever() for closed unions.',
        },
        // No barrel files: ban `export * from '...'`. Import from the concrete path.
        {
          selector: 'ExportAllDeclaration',
          message: 'No barrel re-exports — import directly from the concrete file path.',
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
                'Infrastructure must not depend on contracts, the main/preload/renderer layers, or electron.',
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

  // ── Code Quality Kit: relax the 15-line cap for React components ──────────
  // Uncomment if max-lines-per-function:15 is too aggressive on JSX-heavy .tsx.
  // ,{
  //   files: ['**/*.tsx'],
  //   rules: { 'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }] },
  // }
);
