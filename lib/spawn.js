
const spawn = require('cross-spawn');


/**
 * spawn的promise封装
 * @param args
 * @returns {Promise<any>}
 */
function spawnPro(...args){
  return new Promise((cb,eb) => {
    spawn(...args).on('exit',code => {
      if(code){
        eb(code);
      }else{
        cb();
      }
    })
  })
}


module.exports = spawnPro;
