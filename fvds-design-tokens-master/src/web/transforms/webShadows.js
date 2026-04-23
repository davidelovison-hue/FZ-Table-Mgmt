const TinyColor = require('@ctrl/tinycolor')

module.exports = {
  type: 'value',
  transitive: true,
  matcher: function (token) {
    return token.type === 'boxShadow' && token.value !== 0
  },
  transformer: function ({ value }) {
    return `${value.type === 'innerShadow' ? 'inset ' : ''}${value.x}px ${value.y}px ${value.blur}px ${value.spread}px ${value.color}`
  }
}
