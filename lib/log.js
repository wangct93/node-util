
const log4js = require('log4js');
const {resolve} = require('./path');
let cacheConfig = {};
let configInited = false;

module.exports = {
  log,
  logInfo:log,
  logErr,
  addLogConfig,
  getLogger,
};

initLogConfig();

/**
 * 获取log对象
 * @param args
 */
function getLogger(...args){
    return log4js.getLogger(...args);
}


/**
 * 打印
 * @param args
 */
function log(...args){
    getLogger().info(...args);
}

/**
 * 打印错误
 * @param args
 */
function logErr(...args){
  getLogger().error(...args);
}

/**
 * 初始化log4j配置
 * @author wangchuitong
 */
function initLogConfig() {
  if (configInited) {
    return;
  }
  configInited = true;
  addLogConfig({
    appenders: {
      main: {
        type: 'dateFile',
        filename: resolve('logs/main.txt'),
        keepFileExt: true,
        alwaysIncludePattern: true,
      },
      console: {
        type: 'console',
      }
    },
    categories: {
      default: {
        appenders: ['main', 'console'],
        level: 'info',
      },
    }
  });
}

/**
 * 添加日志配置
 * @param config
 */
function addLogConfig(config = {}){
  cacheConfig = {
    appenders:{
      ...cacheConfig.appenders,
      ...config.appenders,
    },
    categories:{
      ...cacheConfig.categories,
      ...config.categories,
    }
  };
  log4js.configure(cacheConfig);
}
