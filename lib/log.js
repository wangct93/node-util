
const log4js = require('log4js');
const {resolve} = require('./path');
log4js.configure({
    appenders: {
        log: {
            type: 'dateFile',
            filename: resolve('temp/log4js/log.txt'),
            keepFileExt:true,
            alwaysIncludePattern:true,
        }
    },
    categories: {
        default: {
            appenders: ['log'],
            level:'info',
        },
    }
});

exports.log = log;
exports.getLogger = getLogger;

function getLogger(...args){
    return log4js.getLogger(...args);
}

const logger = log4js.getLogger();
function log(...args){
    logger.info(...args);
}
