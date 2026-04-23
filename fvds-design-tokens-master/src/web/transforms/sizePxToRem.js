const StyleDictionary = require('style-dictionary');

const pxToRem = StyleDictionary.transform['size/pxToRem'];

module.exports = {
  ...pxToRem,
  matcher: function (token) {
    if (!pxToRem.matcher(token)) {
      return false;
    }

    if (!/^[0-9]+$/.test(token.value)) {
      return false;
    }

    return pxToRem.matcher(token);
  }
};