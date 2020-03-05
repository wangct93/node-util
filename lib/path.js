
const path = require('path');


module.exports = {
  resolve,
};

/**
 * 根据项目路径合并路径
 * @param paths
 * @returns {string}
 */
function resolve(...paths){
  return path.resolve(process.cwd(),...paths);
}
