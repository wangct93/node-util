/**
 * Created by wangct on 2019/2/1.
 */

const Worker = require('./worker');

function fork(path,data,cb){
    new Worker({path}).send(data,cb);
}

module.exports = fork;