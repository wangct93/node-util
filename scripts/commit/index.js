const spawn = require("../../lib").spawn;

start();

/**
 * 入口
 * @returns {Promise<void>}
 */
async function start(){
  await spawn('git',['add','.']);
  await spawn('git',['commit','-m','脚本提交']);
}
