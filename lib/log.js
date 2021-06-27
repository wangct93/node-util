
const log4js = require('log4js');
const {setConfig} = require("./cache");
const {getConfig} = require("./cache");
const {resolve} = require('./path');

module.exports = {
  log,
  logInfo:log,
  logErr,
  logTrace,
  setLevel,
  addLogConfig,
  getGlobalLogger,
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

function getGlobalLogger(){
  let logger = getConfig('logger');
  if(!logger){
    logger = getLogger();
    setConfig('logger',logger);
  }
  return logger;
}

function setLevel(level){
  getGlobalLogger().level = level;
}

/**
 * 打印
 * @param args
 */
function log(...args){
  getGlobalLogger().info(...args);
}

function logTrace(...args){
  getGlobalLogger().trace(...args);
}

/**
 * 打印错误
 * @param args
 */
function logErr(...args){
  getGlobalLogger().error(...args);
}

/**
 * 初始化log4j配置
 * @author wangchuitong
 */
function initLogConfig() {
  if(getConfig('logConfigInited')){
    return;
  }
  setConfig('logConfigInited',true);
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
  const oldConfig = getConfig('logConfig') || {};
  const newConfig = {
    appenders:{
      ...oldConfig.appenders,
      ...config.appenders,
    },
    categories:{
      ...oldConfig.categories,
      ...config.categories,
    }
  };
  setConfig('logConfig',newConfig);
  log4js.configure(newConfig);
}
