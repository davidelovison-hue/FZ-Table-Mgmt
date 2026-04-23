const { formatHelpers } = require('style-dictionary-utils');
const {
  capitalizeFirstLetter,
  formatOutputReference,
  removePrefixUntilFirstCapital,
  convertToCamelCase,
  cleanName,
  rootName,
  indentation,
  semanticColorReference
} = require('./commonColorFormatters');

const generateSubEnumBlock = (subEnumName, colors) => {
  const colorSwitchCases = colors.map((color) => {
    const caseName = convertToCamelCase(removePrefixUntilFirstCapital(color.enumName));
    if (color.outputReference.startsWith("Palette")) {
      return `${indentation(2)}case .${caseName}: return UIColor(named: "${color.outputReference}", in: brandAssetsBundle, compatibleWith: nil)!`;
    } else {
      return `${indentation(2)}case .${caseName}: ${semanticColorReference(color.outputReference)}.uiColor`;
    }
  });

  const subEnumBlock = `extension ${rootName}.${subEnumName} {
${indentation(1)}var uiColor: UIColor {
${indentation(2)}switch self {
${colorSwitchCases.join('\n')}
${indentation(2)}}
${indentation(1)}}
}`;

  return subEnumBlock;
};

module.exports = ({ dictionary, platform, file }) => {
  const colors = dictionary.allTokens
    .map((token) => {
      const tokenName = cleanName(token.name);
      const enumName = capitalizeFirstLetter(tokenName);
      const enumCase = convertToCamelCase(removePrefixUntilFirstCapital(enumName));
      const outputReference = formatOutputReference(token.original.value);
      return { enumName, enumCase, outputReference };
    });

  const subEnums = {};
  colors.forEach((color) => {
    const [main, ...sub] = color.enumName.split(/(?=[A-Z])/);
    const subEnumName = capitalizeFirstLetter(main);
    const subEnumValue = sub.map(removePrefixUntilFirstCapital).join('');
    subEnums[subEnumName] = subEnums[subEnumName] || [];
    subEnums[subEnumName].push({ ...color, enumName: subEnumValue });
  });

  const subEnumBlocks = Object.entries(subEnums).map(([main, colors]) => {
    const subEnumBlock = generateSubEnumBlock(main, colors);
    return subEnumBlock;
  });

  const header = formatHelpers.fileHeader({ file, commentStyle: 'short' }).trimStart();
  const enumBlock = `import UIKit

${subEnumBlocks.join('\n\n')}`;

  return header + enumBlock;
};
