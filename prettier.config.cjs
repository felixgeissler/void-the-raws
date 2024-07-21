/* eslint-env es6 */

/** @type {import("prettier").Config} */
const config = {
  /**
   * Options like end_of_line, indent_style, indent_size and max_line_length
   * are not included here because they are already defined in .editorconfig
   *
   * Note:
   * In the CLI those properties are read, even without options.editorconfig
   * set to true (see [1] & [2]). Thus we don't set it here.
   *
   * [1] https://github.com/prettier/prettier/issues/15255#issuecomment-1801339582
   * [2] https://prettier.io/docs/en/configuration#editorconfig
   */
  singleQuote: true,
  arrowParens: 'avoid',
  trailingComma: 'es5',
  bracketSameLine: true,
  plugins: [],
};

module.exports = config;
