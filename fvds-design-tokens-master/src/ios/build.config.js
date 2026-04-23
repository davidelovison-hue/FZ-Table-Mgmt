module.exports = {
  include: [
    "build/tokens/primitives/**/*.json", 
    "build/tokens/semantic/**/*.json", 
    "build/tokens/components/**/*.json"
  ],
  source: ["build/tokens/ios/**/*.json"],
  action: {
    colorsets: require("./actions/colorSet"),
  },
  platforms: {
    "ios-colorsets": {
      buildPath: "build/ios/",
      transforms: ["attribute/cti", "name/cti/pascal", "attribute/color"],
      actions: [`colorsets`],
    },
    "ios-colors": {
      transformGroup: 'ios',
      buildPath: 'build/ios/',
      files: [
        {
          destination: 'IgniteColorSemantics.swift',
          format: 'custom/colorEnums',
          filter: "colorOrButtonExceptPalette"
        },
        {
          destination: 'IgniteColorSemantics+UIKit.swift',
          format: 'custom/colorUIKit',
          filter: "colorOrButtonExceptPalette"
        },
        {
          destination: 'IgniteColorSemantics+SwiftUI.swift',
          format: 'custom/colorSwiftUI',
          filter: "colorOrButtonExceptPalette"
        }
      ],
    },
  },
};
