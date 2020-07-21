const path = require('path');
const fs = require('fs');
const {isFunc,onceQueue,toPromise} = require('util-1');
const pathUtil = require('./path');
const {cbPromise} = require("./util");

const {resolve} = pathUtil;

module.exports = {
  eachFile,
  copyFile,
  mkdir,
  isDir,
  isExist,
  deleteFile,
  getFiles
};

/**
 * 遍历所有文件
 * @param filePath
 * @param func
 * @param options
 * @returns {Promise<Array>}
 */
async function eachFile(filePath,func,options = {}){
  const result = [];
  async function exec(filePath,func,options = {}){
    filePath = resolve(filePath);
    if(!isValidPath(filePath,options)){
      return;
    }
    result.push(filePath);
    const isDirPath = isDir(filePath);
    await toPromise(func,filePath,isDirPath).catch(() => {});
    if(isDirPath){
      const list = await getFiles(filePath);
      await onceQueue(list,(subFilePath) => {
        return exec(subFilePath,func,options);
      });
    }
  }
  await exec(filePath,func,options);
  return result;
}

/**
 * 是否为有效地址
 * @param filePath
 * @param include
 * @param exclude
 * @returns {boolean|*}
 */
function isValidPath(filePath,{include,exclude}){
  return (!include || include(filePath)) && (!exclude || !exclude(filePath));
}

/**
 * 拷贝文件
 * @param src
 * @param output
 * @param options
 * @returns {Promise<void>}
 */
async function copyFile(src,output,options) {
  src = resolve(src);
  output = resolve(output);
  await eachFile(src,(filePath,dir) => {
    const outputPath = path.join(output, path.relative(src, filePath));
    if(dir){
      mkdir(outputPath);
    }else{
      const {transform} = options;
      if(isFunc(transform)){
        return transform(filePath,outputPath);
      }else{
        return new Promise(cb => {
          const rs = fs.createReadStream(filePath);
          const ws = fs.createWriteStream(outputPath);
          rs.pipe(ws);
          ws.on('close',cb);
        });
      }
    }
  },options);
}

/**
 * 新建文件夹
 * @param dirPath
 */
function mkdir(dirPath){
  try{
    fs.mkdirSync(resolve(dirPath),{
      recursive:true
    });
  }catch(e){}
}

/**
 * 判断是否为文件夹
 * @param filePath
 * @returns {Stats | boolean}
 */
function isDir(filePath){
  let stat;
  try{
    stat = fs.statSync(filePath);
  }catch(e){}
  return stat && stat.isDirectory();
}

/**
 * 判断文件是否存在
 * @param filePath
 * @returns {boolean}
 */
function isExist(filePath){
  let bol;
  try{
    fs.accessSync(filePath);
    bol = true;
  }catch(e){}
  return bol;
}

/**
 * 删除文件
 * @param filePath
 * @returns {Promise<any>}
 */
async function deleteFile(filePath) {
  if(!filePath){
    return null;
  }
  filePath = resolve(filePath);
  const dir = isDir(filePath);
  if(dir){
    const list = await getFiles(filePath);
    await onceQueue(list,(filename) => deleteFile(filename)).then(() => {
      return cbPromise(fs,'rmdir',filePath);
    });
  }else{
    await cbPromise(fs,'unlink',filePath);
  }
}

async function getFiles(dirname) {
  if(!dirname){
    return [];
  }
  return cbPromise(fs,'readdir',resolve(dirname)).then((list) => {
    return list.map((item) => resolve(dirname,item));
  });
}
