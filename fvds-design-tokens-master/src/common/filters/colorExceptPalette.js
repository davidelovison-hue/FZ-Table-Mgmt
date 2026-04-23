const colorExceptPalette = (token) => {
  return token.attributes.category === 'color' && token.attributes.type !== 'palette'
};

module.exports = colorExceptPalette;
