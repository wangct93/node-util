/**
 * Created by wangct on 2018/12/23.
 */

const util = require('../lib');

console.log(util.getLocalIp());

util.getOuterNetIp().then(d => {
  console.log(d);
});