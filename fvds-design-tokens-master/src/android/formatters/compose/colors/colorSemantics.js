const { formatHelpers } = require('style-dictionary-utils');

module.exports = function ({ dictionary,file, options }) {
  const { outputReferences = true } = options;
  const formattedVariables = formatHelpers.formattedVariables({ format: 'compose/object', dictionary, outputReferences });

  const transformedVariables = formattedVariables
    .split('\n')
    .map((line) => {
      if (line.trim() !== '') {
        const [variableName, variableValue] = line.split('=');
        const formattedVariableName = variableName
          .trim().replace(/^\w/, (c) => c.toLowerCase());
        const formattedVariableValue = variableValue
          .trim().replace(/;$/, '');
        return `    val ${formattedVariableName}: Color = ${formattedVariableValue}`;
      }
      return line;
    })
    .join('\n');

  return `package com.feverup.shared_ui.compose.theme.color\n\n`
    + `import androidx.compose.ui.graphics.Color\n`
    + formatHelpers.fileHeader({ file, commentStyle: 'short' })
    + `object IgniteColors {\n`
    +  `    `
    + transformedVariables.trim()
    + `\n}\n`;
};
