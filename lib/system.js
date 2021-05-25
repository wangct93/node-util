const {catchProErr} = require("./util");
const {logTrace} = require("./log");
const logInfo = require("./log").logInfo;
const {logErr} = require("./log");
const {toStr} = require('@wangct/util');

module.exports = {
  isWindows,
  getCmdParams,
  checkPortUsable,
  execCmd,
  getProcessIdByPort,
  stopServiceByPort,
  closePort,
  processExist,
  killProcess,
  killSelf,
};

function isWindows(){
  return require('os').platform() === 'win32';
}

function getCmdParams(){
  const args = process.argv.slice(2);
  const params = {};
  args.forEach((item,index) => {
    params[index] = item;
    if(item.startsWith('-')){
      params[item.replace(/^-+/g,'')] = args[index + 1];
    }
  });
  return params;
}

/**
 * 判断端口是否可用
 * @param port
 */
async function checkPortUsable(port){
  const p1 = portUseableFunc(port);
  const p2 = portUseableFunc(port,true);
  const useable1 = await p1;
  const useable2 = await p2;
  return useable1 && useable2;
}

/**
 * 判断端口是否可用方法
 * @param port
 * @param useIp
 */
function portUseableFunc(port,useIp) {
  return new Promise(cb => {
    const http = require('http');
    const server = http.createServer().listen(port, useIp && '0.0.0.0',() => {
      server.close();
      cb(true);
    });
    server.on('error', () => {
      cb(false);
    });
  })
}

/**
 * 关闭端口
 * @param port
 */
async function closePort(port){
  await stopServiceByPort(port).catch(() => {});
  const useable = await checkPortUsable(port);
  if(!useable){
    throw '关闭端口失败';
  }
  return true;
}

async function execCmd(cmdStr){
  const {exec} = require('child_process');
  return new Promise((cb,eb) => {
    exec(cmdStr,(err,stdout) => {
      if(err){
        eb(err);
      }else{
        cb(stdout);
      }
    });
  });
}

async function getProcessIdByPort(port){
  return isWindows() ? getProcessIdByPortOnWindows(port) : getProcessIdByPortOnLinux(port);
}

async function getProcessIdByPortOnWindows(port){
  const result = await execCmd(`netstat -aon | findstr "${port}"`);
  let items = result.split('\n')[0].trim().split(/\s+/);
  let address = items[1];
  let pid = items[4];
  if (address.split(':')[1] !== port + '' || !pid || pid.length === 0) {
    return 0;
  }
  return pid;
}

async function getProcessIdByPortOnLinux(port){
  const result = await execCmd(`netstat -lnop | grep "${port}"`);
  let items = result.split('\n')[0].trim().split(/\s+/);
  let address = items[1];
  let pid = items[6].split('/')[0];
  if (address.split(':')[1] !== port + '' || !pid || pid.length === 0) {
    return 0;
  }
  return pid;
}

async function killProcess(pid){
  const pro = isWindows() ? killProcessOnWindows(pid) : killProcessOnLinux(pid);
  return catchProErr(pro);
}

async function killProcessOnWindows(pid){
  return execCmd(`taskkill /F /pid ${pid}`);
}

async function killProcessOnLinux(pid){
  return execCmd(`kill ${pid}`);
}

async function stopServiceByPort(port){
  const pid = await getProcessIdByPort(port);
  return killProcess(pid);
}

async function processExist(pid){
  const pro = isWindows() ? processExistOnWindows(pid) : processExistOnLinux(pid);
  return pro.catch((e) => {
    logTrace('不影响流程',e);
    return false;
  }).then((bol) => {
    logTrace('检查进程存在：',pid,bol ? '已存在' : '不存在');
    return bol;
  });
}

async function processExistOnWindows(pid){
  const result = await execCmd(`tasklist | findstr ${pid}`);
  const lines = result.split('\n').length;
  if(lines.length === 0){
    return false;
  }
  return lines[0].split(/\s+/)[1] == pid;
}

async function processExistOnLinux(pid){
  const result = await execCmd(`netstat -lnop | grep "${pid}"`);
  const lines = result.split('\n').length;
  if(lines.length === 0){
    return false;
  }
  return toStr(lines[0].split(/\s+/)[5]).split('/')[0] == pid;
}

async function killSelf(sign = 0,pro = process){
  logTrace('退出服务',pro.pid);
  return pro.exit(sign);
}
