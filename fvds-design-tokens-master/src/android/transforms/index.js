const commonTransforms = require('../../common/transforms');
const removeColorName = require('./removeColorName');

const transform = {
  ...commonTransforms(),
  removeColorName
};

module.exports = {
  transform,
  group: {
    'custom/android/xml': [
      'attribute/cti',
      'name/cti/snake',
      'size/remToSp',
      'size/remToDp',
    ].concat(Object.keys(transform)),
    'custom/android/compose': [
      'attribute/cti',
      'name/cti/camel',
      'color/composeColor',
      'size/compose/em',
      'size/compose/remToSp',
      'size/compose/remToDp'
    ].concat(Object.keys(transform))
  }
};
