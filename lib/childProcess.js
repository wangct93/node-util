
const {processExist} = require("./system");
const {killSelf} = require("./system");
const {logInfo} = require("./log");
const {logErr} = require("./log");
const {callFunc} = require('@wangct/util');

/**
 * spawn的promise封装
 * @param cmd
 * @param args
 * @param options
 * @returns {Promise<any>}
 */
function spawn(cmd, args, options = {}){
  return new Promise((cb,eb) => {
    const cs = require('cross-spawn')(cmd,args,{
      stdio: 'inherit',
      ...options,
    });
    cs.on('close',(code,...args) => {
      if(code === 0){
        cb(code);
      }else{
        logErr('错误码',code,...args);
        eb(code);
      }
    });
  });
}

function fork(url,options = {}){
  const childModule = require('child_process').fork(url,options);
  let isClose = false;
  let timeoutTimer;
  childModule.on('close',(e) => {
    isClose = true;
    clearTimeout(timeoutTimer);
    setTimeout(() => {
      callFunc(options.onClose,e);
    },0);
  });

  function interval(func){
    const timer = setInterval(async () => {
      const isExist = await processExist(childModule.pid);
      if(isClose || isExist){
        clearInterval(timer);
        callFunc(options.onStart);
        callFunc(func,childModule);
      }
    },500);
  }

  if(options.timeout){
    timeoutTimer = setTimeout(() => {
      logInfo('超时关闭',childModule.pid);
      killSelf(504,childModule);
    },options.timeout * 1000);
  }

  if(options.promise){
    return new Promise(interval);
  }else{
    interval();
  }
  return childModule;
}


module.exports = {
  spawn,
  fork,
};
