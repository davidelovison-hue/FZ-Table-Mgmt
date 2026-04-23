const path = require('path');
const fs = require('fs-extra');

const itemsMap = require('../data/ignite.tokens.json');

Object.keys(itemsMap).filter(key => key !== '$themes' && key !== '$metadata').map((item) => {
  const file = item + ".json";
  itemsMap[item].tokenset = item;
  fs.ensureDirSync('build/tokens/' + path.dirname(file));
  fs.writeJsonSync('build/tokens/' + file, itemsMap[item], {spaces: 2});
});
