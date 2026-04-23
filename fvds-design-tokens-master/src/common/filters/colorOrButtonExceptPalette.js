const colorOrButtonExceptPalette = (token) => {
  return (token.attributes.category === 'color' || token.attributes.category === 'button') && token.attributes.type !== 'palette'
};

module.exports = colorOrButtonExceptPalette;
