const spawn = require("../../lib").spawn;


start();

/**
 * 开始发布
 * @author wangchuitong
 */
async function start(){
  await spawn('npm',['run','pu-cmd']).then(() => {
    console.log('发布成功');
  }).catch((code) => {
    console.log('发布失败，错误码：',code);
  });
}
