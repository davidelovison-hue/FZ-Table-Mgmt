const commonTransforms = require('../../common/transforms');

const transform = {
  ...commonTransforms(),
  'web/shadow': require('./webShadows'),
  'web/radius': require('./webRadius'),
  'web/padding': require('./webPadding'),
  'web/font': require('./webFont'),
  'web/gradient': require('./webGradient'),
  'web/size-pxToRem': require('./sizePxToRem'),
};

module.exports = {
  transform,
  group: {
    'custom/scss': [
      'attribute/cti',
      'name/cti/kebab',
      'time/seconds',
      'color/css',
    ].concat(Object.keys(transform))
  }
};