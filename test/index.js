/**
 * Created by wangct on 2018/12/23.
 */

const util = require('../lib');

util.eachFile('lib',{
  execItem(filepath){
    return new Promise(cb => {
      setTimeout(() => {
        cb();
      },500);
      console.log(filepath);
    })
  }
}).then(list => {
  console.log(list);
})
