
const log4js = require('log4js');
const {resolve} = require('./path');

exports.log = log;
exports.getLogger = getLogger;

/**
 * 获取log对象
 * @param args
 */
function getLogger(...args){
    initLogConfig();
    return log4js.getLogger(...args);
}


/**
 * 打印
 * @param args
 */
function log(...args){
    getLogger().info(...args);
}

let configInited = false;

/**
 * 初始化log4j配置
 * @author wangchuitong
 */
function initLogConfig(){
    if(configInited){
        return;
    }
    configInited = true;
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
}
