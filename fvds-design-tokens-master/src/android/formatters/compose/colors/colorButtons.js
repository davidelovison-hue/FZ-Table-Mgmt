const { formatHelpers } = require('style-dictionary-utils');

function formatVariableName(variableName) {
  const cleanedVariableName = variableName.trim().replace(/^buttoncolor/i, '');
  return cleanedVariableName.charAt(0).toLowerCase() + cleanedVariableName.slice(1);
}

function formatColorVariableForFun(variableName, variableValue) {
  const formattedVariableName = formatVariableName(variableName);
  let formattedVariableValue = variableValue.trim().replace(/;$/, '');

  if (!formattedVariableValue.startsWith("Palette") && !formattedVariableValue.startsWith("buttonColor")) {
    formattedVariableValue = `IgniteTheme.colors.${formattedVariableValue.charAt(0).toLowerCase() + formattedVariableValue.slice(1)}`;
  }

  if (formattedVariableValue.startsWith("buttonColor")) {
    formattedVariableValue = `${formattedVariableValue.replace(/^buttonColor/, '')}`;
    formattedVariableValue = formattedVariableValue.charAt(0).toLowerCase() + formattedVariableValue.slice(1);
  }

  return `${formattedVariableName}: Color = ${formattedVariableValue}`;
}

function formatColorClassVariables(variableName) {
  const formattedVariableName = formatVariableName(variableName);
  return `    val ${formattedVariableName}: Color,`;
}

function formatColorVariableForReturn(variableName) {
  const formattedVariableName = formatVariableName(variableName);
  return `        ${formattedVariableName},`;
}

module.exports = function ({ dictionary, file, options }) {
  const { outputReferences = true } = options;
  const formattedVariables = formatHelpers.formattedVariables({
    format: 'compose/object',
    dictionary,
    outputReferences,
  });

  const transformedVariablesForFun = formattedVariables
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [variableName, variableValue] = line.split('=');
      return formatColorVariableForFun(variableName, variableValue);
    });

  const formattedFunctionVariablesForFun = transformedVariablesForFun
    .map((variable) => `    ${variable}`)
    .join(',\n');

  const transformedVariablesForReturn = formattedVariables
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [variableName] = line.split('=');
      return formatColorVariableForReturn(variableName);
    });

  const formattedFunctionVariablesForReturn = transformedVariablesForReturn.join('\n');

  const transformedClassVariables = formattedVariables
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [variableName] = line.split('=');
      return formatColorClassVariables(variableName);
    });

  const formattedClassVariables = transformedClassVariables.join('\n');

  return `package com.feverup.shared_ui.components.input\n\n`
    + `import androidx.compose.runtime.Composable\n`
    + `import androidx.compose.ui.graphics.Color\n`
    + `import com.feverup.shared_ui.theme.IgniteTheme\n`
    + `import com.feverup.shared_ui.theme.color.*\n`
    + formatHelpers.fileHeader({ file, commentStyle: 'short' })
    + `@Suppress("LongParameterList")\n`
    + `@Composable\n`
    + `fun feverButtonColors(\n`
    + `${formattedFunctionVariablesForFun}\n`
    + `): FeverButtonColors {\n\n`
    + `    return FeverButtonColors(\n`
    + `${formattedFunctionVariablesForReturn}\n`
    + `    )\n`
    + `}\n\n`
    + `class FeverButtonColors(\n`
    + `${formattedClassVariables}\n`
    + `)`
    + `\n`;
};
