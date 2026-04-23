const { formatHelpers } = require('style-dictionary-utils');

module.exports = function({dictionary, options, file}) {
  const { outputReferences = true } = options;
  return formatHelpers.fileHeader({ file, commentStyle: 'short' })
    + `@use "color-palette";\n\n`
    + formatHelpers.formattedVariables({ format: 'sass', dictionary, outputReferences });
};