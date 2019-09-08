
const spawn = require('cross-spawn');




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
