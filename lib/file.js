const path = require('path');
const fs = require('fs');
const {isFunc,onceQueue,toPromise} = require('wangct-util');
const pathUtil = require('./path');

const {resolve} = pathUtil;

module.exports = {
  eachFile,
  copyFile,
  mkdir,
  isDir,
  isExist,
  deleteFile
};

/**
 * 遍历所有文件
 * @param filePath
 * @param options
 * @returns {Promise<Array>}
 */
async function eachFile(filePath,options = {}){
  filePath = resolve(filePath);
  const {result = []} = options;
  if(!isValidPath(filePath,options)){
    return result;
  }
  const isDirBol = isDir(filePath);
  result.push(filePath);
  await toPromise(options.execItem,filePath,isDirBol).catch(e => {});
  if(isDirBol){
    await eachFolder(filePath,{
      ...options,
      result
    }).catch(e => {});
  }
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
 * 遍历文件夹
 * @param dirname
 * @param options
 * @returns {Promise<Array>}
 */
async function eachFolder(dirname,options){
  const children = fs.readdirSync(dirname);
  if(!children.length){
    return;
  }
  return onceQueue({
    list:children,
    func(filename){
      return eachFile(path.join(dirname,filename),options);
    },
  })
}

/**
 * 拷贝文件
 * @param options
 * @returns {Promise<Promise<any>|*>}
 */
async function copyFile(options) {
  const output = resolve(options.output);
  await eachFile(options.src,{
    ...options,
    execItem(filePath,isDir){
      const outputPath = path.join(output, path.relative(options.src, filePath));
      if(isDir){
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
    }
  });
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
function deleteFile(filePath) {
  return new Promise((cb, eb) => {
    if (isDir(filePath)) {
      deleteDir(filePath).then(cb,eb);
    } else {
      fs.unlink(filePath, (err) => err ? eb(err) : cb());
    }
  });
}

/**
 * 删除文件夹
 * @param dirname
 * @returns {Promise<any>}
 */
function deleteDir(dirname){
  return new Promise((cb,eb) => {
    const pro = new Promise((cb, eb) => {
      fs.readdir(dirname, (err, list) => {
        if (err) {
          eb(err);
        } else {
          const pros = list.map(item => deleteFile(path.join(dirname, item)));
          Promise.all(pros).then(cb).catch(eb);
        }
      })
    });
    pro.then(() => {
      fs.rmdir(dirname, (err) => err ? eb(err) : cb())
    },eb);
  })
}
