const build = require('../common/build');
const config = require('./build.config.js');
const filters = require('./filters');
const formatters = require('./formatters')

build(config, { transforms: {}, formatters, filters });
