const fs = require("fs");
const path = require("path");

const CONTENTS = {
  info: {
    author: "xcode",
    version: 1,
  },
};

const createDir = (path) => {
  try {
    fs.mkdirSync(path, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
};

const generateTokenFile = (tokenPath, attributes) => {
  createDir(tokenPath);

  fs.writeFileSync(
    `${tokenPath}/Contents.json`,
    JSON.stringify(
      {
        ...CONTENTS,
        colors: [
          {
            idiom: "universal",
            color: {
              "color-space": "srgb",
              components: {
                red: attributes.rgb?.r?.toString() || "0",
                green: attributes.rgb?.g?.toString() || "0",
                blue: attributes.rgb?.b?.toString() || "0",
                alpha: attributes.rgb?.a?.toString() === "1" ? "1.0" : attributes.rgb?.a?.toString() || "1.0",
              },
            },
          },
        ]
      },
      null,
      2
    )
  );
};

module.exports = {
  do: (dictionary, { buildPath }) => {
    const paletteAssetPath = path.join(buildPath, "PaletteTokens.xcassets");

    createDir(paletteAssetPath);
    fs.writeFileSync(
      `${paletteAssetPath}/Contents.json`,
      JSON.stringify(CONTENTS, null, 2)
    );

    dictionary.allProperties.forEach(({ name, attributes }) => {
      const tokenName = name.replace(/^Color|Default$/g, "");

      if (attributes.category === "color" && attributes.type === "palette") {
        const colorsetPath = path.join(paletteAssetPath, `${tokenName}.colorset`);
        generateTokenFile(colorsetPath, attributes);
      }
    });
  },
  undo: function (dictionary, platform) {},
};
