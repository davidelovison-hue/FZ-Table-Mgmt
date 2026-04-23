const StyleDictionary = require('style-dictionary');

module.exports = function build(config, { transforms, formatters, filters }) {
  transforms = transforms ? transforms : {};

  Object.keys(transforms.transform || {}).forEach(name => StyleDictionary.registerTransform({ name, ...transforms.transform[name] }));
  Object.keys(transforms.group || {}).forEach(name => StyleDictionary.registerTransformGroup({ name, transforms: transforms.group[name] }));
  Object.keys(formatters || {}).forEach(name => StyleDictionary.registerFormat({ name, formatter: formatters[name] }));

  Object.keys(filters || {}).forEach(name => StyleDictionary.registerFilter({ name, matcher: filters[name] }));

  const styleDictionary = StyleDictionary.extend(config);
  styleDictionary.buildAllPlatforms();
};
