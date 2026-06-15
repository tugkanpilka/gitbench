// CSS Modules deterministic floor — the mechanical part jsx-css-reviewer defers to.
// npm i -D stylelint stylelint-config-standard
// Run: npx stylelint "src/**/*.module.css"

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Short camelCase class names so JS access reads `styles.title`.
    // (The agent judges whether a name is *too long* / presentational; this just
    //  enforces the shape.)
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: 'Use short camelCase class names; module scope already gives context.' },
    ],

    // CSS Modules `composes` is not a standard property — don't flag it.
    'property-no-unknown': [true, { ignoreProperties: ['composes'] }],

    // Optional, opinionated token enforcement (can be noisy — enable when ready):
    // 'color-no-hex': true,                                   // force color tokens
    // 'unit-disallowed-list': ['px', { ignoreProperties: { 'border-width': ['px'] } }], // force spacing tokens
  },
};
