const build = require('../common/build');
const config = require('./build.config.json');
const transforms = require('./transforms');
const filters = require('./filters');
const formatters = require('./formatters');

build(config, { transforms, formatters, filters });
