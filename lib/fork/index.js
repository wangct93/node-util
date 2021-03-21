/**
 * Created by wangct on 2019/2/1.
 */

const Worker = require('./worker');

/**
 * 新建一个进程
 * @param path
 * @param data
 * @param cb
 */
function fork(path,data,cb){
    new Worker({path}).send(data,cb);
}

module.exports = {
  fork,
};
