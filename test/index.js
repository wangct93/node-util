const {getLogger} = require('../lib/log');

const log = getLogger();

log.level = 'info';

log.info(123);
