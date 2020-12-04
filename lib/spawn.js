/**
 * spawn的promise封装
 * @param cmd
 * @param args
 * @param options
 * @returns {Promise<any>}
 */
function spawn(cmd,args,options = {}){
  return new Promise((cb,eb) => {
    const cs = require('cross-spawn')(cmd,args,{
      stdio: 'inherit',
      stdout:'inherit',
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


module.exports = spawn;
