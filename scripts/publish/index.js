
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

/**
 * 执行命令
 * @author wangchuitong
 */
function spawn(cmd,args,options = {}){
  return new Promise((cb,eb) => {
    const cs = require('cross-spawn')(cmd,args,{
      stdio: 'inherit',
      ...options,
    });
    cs.on('close',(code) => {
      if(code === 0){
        cb(code);
      }else{
        eb(code);
      }
    });
  });
}
