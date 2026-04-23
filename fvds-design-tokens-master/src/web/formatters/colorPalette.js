const { formatHelpers } = require('style-dictionary-utils');

module.exports = function({dictionary, options, file}) {
  const { themeable = true } = options;
  return formatHelpers.fileHeader({ file, commentStyle: 'short' })
    + formatHelpers.formattedVariables({ format: 'sass', dictionary, themeable });
};