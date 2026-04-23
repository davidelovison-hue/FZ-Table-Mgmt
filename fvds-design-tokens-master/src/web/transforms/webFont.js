const dependencies = require('../helpers/dependencies');

dependencies.add('sass:list');

const notDefault = (value, defaultValue) => value ? value : defaultValue;
const fontFamily = ({ fontFamily }, { fontFamilies } = {}) => fontFamilies && fontFamilies[fontFamily] ? fontFamilies[fontFamily] : fontFamily;

module.exports = {
  type: 'value',
  transitive: true,
  matcher: function (token) {
    return token.type === 'typography'
  },
  transformer: function ({ value: font }, { options }) {
    // font: font-style font-variant font-weight font-size/line-height font-family;
    return `${notDefault(font.fontStretch, 'normal')} ${notDefault(font.fontStyle, 'normal')} ${font.fontWeight} list.slash(${font.fontSize}, ${font.lineHeight}) ${fontFamily(font, options)}`.trim()
  }
}
