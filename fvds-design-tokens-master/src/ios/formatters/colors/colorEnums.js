const { formatHelpers } = require('style-dictionary-utils');
const {
  capitalizeFirstLetter,
  formatOutputReference,
  removePrefixUntilFirstCapital,
  convertToCamelCase,
  cleanName,
  rootName,
  indentation
} = require('./commonColorFormatters');

const generateSubEnumBlock = (subEnumName, colors) => {
  const enumCases = colors.map((color) => `${indentation(2)}case ${convertToCamelCase(removePrefixUntilFirstCapital(color.enumName))}`);

  const subEnumBlock = `${indentation(1)}public enum ${subEnumName}: CaseIterable {
${enumCases.join('\n')}
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
  const enumBlock = `public enum ${rootName} {
${subEnumBlocks.join('\n\n')}
}`;
  return header + enumBlock;
};
