const rootName = "IgniteColor";

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const formatOutputReference = (value) => {
  const parts = value.replace(/[{}]/g, '').split('.').filter(part => part !== 'color');
  return cleanName(parts.map(part => part.replace(/(^|\.)\w/g, match => match.replace('.', '').toUpperCase())).join(''));
};

const removePrefixUntilFirstCapital = (string) => {
  const match = string.match(/[A-Z]/);
  if (match) {
    const index = match.index;
    return string.slice(index);
  }
  return string;
};

const convertToCamelCase = (string) => {
  return string.charAt(0).toLowerCase() + string.slice(1);
};

const cleanName = (string) => {
  return string.replace(/color/i, '').replace(/Default$/i, '');
};

const indentation = (level) => {
  const baseSpaces = "    ";
  return baseSpaces.repeat(level);
};

const semanticColorReference = (tokenName) => {
  const [main, ...sub] = tokenName.split(/(?=[A-Z])/);
  const enumName = capitalizeFirstLetter(main);
  const enumCase = convertToCamelCase(sub.map(removePrefixUntilFirstCapital).join(''));
  return `return ${rootName}.${enumName}.${enumCase}`;
};

module.exports = {
  capitalizeFirstLetter,
  formatOutputReference,
  removePrefixUntilFirstCapital,
  convertToCamelCase,
  cleanName,
  rootName,
  indentation,
  semanticColorReference
};
