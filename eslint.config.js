/* A narrow lint, for the bugs this codebase has actually had rather than for style. The app is plain classic scripts that
   share one global scope, so name-resolution rules (no-undef, no-unused-vars) would only produce noise; what stays on is
   what finds silent mistakes:
     no-dupe-keys     — js/engine.js's WEIGHT_MATRIX once had 24 keys written twice; the later one silently replaced the
                        earlier and about 39 designed links never fired;
     no-dupe-else-if, no-duplicate-case, no-unreachable, no-self-assign, no-unsafe-finally, use-isnan, valid-typeof … */
module.exports = [{
  files: ['js/**/*.js', 'sw.js', 'tools/**/*.js', 'eslint.config.js'],
  languageOptions: {ecmaVersion: 2022, sourceType: 'script'},
  linterOptions: {reportUnusedDisableDirectives: false},
  rules: {
    'no-dupe-keys': 'error', 'no-dupe-else-if': 'error', 'no-duplicate-case': 'error', 'no-dupe-args': 'error',
    'no-unreachable': 'error', 'no-self-assign': 'error', 'no-unsafe-finally': 'error', 'use-isnan': 'error',
    'valid-typeof': 'error', 'no-unsafe-negation': 'error', 'getter-return': 'error', 'no-sparse-arrays': 'error',
    'no-delete-var': 'error', 'no-shadow-restricted-names': 'error', 'no-octal': 'error', 'no-compare-neg-zero': 'error',
    'no-useless-backreference': 'error', 'no-loss-of-precision': 'error',
  },
}];
