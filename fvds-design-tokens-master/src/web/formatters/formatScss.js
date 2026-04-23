const { formatHelpers } = require('style-dictionary-utils');
const dependencies = require('../helpers/dependencies');

function formattedDependencies({ dependencies }) {
  return Array.from(dependencies.values()).map(dependency => `@use "${dependency}";`).join('\n') + '\n\n';
}

module.exports = function({dictionary, options, file}) {
  const { outputReferences, themeable = false } = options;
  return formatHelpers.fileHeader({ file, commentStyle: 'short' })
    + formattedDependencies({ dependencies })
    + formatHelpers.formattedVariables({ format: 'sass', dictionary, outputReferences, themeable });
};