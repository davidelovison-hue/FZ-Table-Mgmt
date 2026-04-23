const { formatHelpers } = require('style-dictionary-utils');

module.exports = function ({ dictionary, file, options }) {
  const { comments = false } = options;
  const formattedVariables = formatHelpers.formattedVariables({ format: 'compose/object', dictionary, comments });

  const transformedVariables = formattedVariables
    .split('\n')
    .map((line) => {
      if (line.trim() !== '') {
        return `internal val ${line.trim().replace(/;$/, '')}`;
      }
      return line;
    })
    .join('\n');

  return `@file:Suppress("MagicNumber")\n\n`
    + `package com.feverup.shared_ui.compose.theme.color\n\n`
    + `import androidx.compose.ui.graphics.Color\n`
    + formatHelpers.fileHeader({ file, commentStyle: 'short' })
    + transformedVariables
    + `\n`;
};
