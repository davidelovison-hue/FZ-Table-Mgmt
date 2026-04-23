const build = require('../common/build');
const config = require('./build.config.json');
const transforms = require('./transforms');
const formatters = require('./formatters');
const filters = require('./filters');

build(config, { transforms, formatters, filters });
