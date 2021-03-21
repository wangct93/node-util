/**
 * spawn的promise封装
 * @param cmd
 * @param args
 * @param options
 * @returns {Promise<any>}
 */
const {logErr} = require("./log");

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


module.exports = {
  spawn,
};
