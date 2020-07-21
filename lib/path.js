
const path = require('path');


module.exports = {
  resolve,
  pathExtname,
  pathFilename
};

/**
 * 根据项目路径合并路径
 * @param paths
 * @returns {string}
 */
function resolve(...paths){
  return path.resolve(process.cwd(),...paths);
}

/**
 * 获取后缀名
 * @param fileName
 * @param hasDou
 * @returns {string}
 */
function pathExtname(fileName,hasDou = false) {
  const extname = path.extname(fileName);
  return hasDou ? extname : extname.substr(1);
}

/**
 * 获取文件名
 * @param fileName
 * @param hasExt
 * @returns {string}
 */
function pathFilename(fileName,hasExt = true){
  return path.basename(fileName,hasExt ? path.extname(fileName) : undefined);
}
