module.exports = {
  type: 'value',
  matcher: function (token) {
    return token.unit === 'percent' && token.value !== 0
  },
  transformer: function (token) {
    return `${token.value}%`
  }
}
