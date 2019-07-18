const path = require('path');
const fs = require('fs');
const {callFunc,isFunc,onceQueue} = require('wangct-util');
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


async function eachFile(filePath,options){
  filePath = resolve(filePath);
  const {result = []} = options;
  const isDirBol = isDir(filePath);
  result.push(filePath);
  await callFunc(options.execItem,filePath,isDirBol).catch(e => {});
  if(isDirBol){
    await eachFolder(filePath,{
      ...options,
      result
    }).catch(e => {});
  }
  return result;
}

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

async function copyFile(options) {
  const output = resolve(options.output);
  await eachFile(options.src,{
    execItem(filePath,isDir){
      const outputPath = path.join(output, path.relative(src, filePath));
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

function mkdir(dirPath){
  dirPath = resolve(dirPath);
  const pathAry = path.dirname(dirPath).split(/[\\\/]/);
  pathAry.slice(1).forEach((item,index) => {
    try{
      fs.mkdirSync(path.join(...pathAry.slice(0,index + 2)));
    }catch(e){}
  });
  if(!path.basename(dirPath).includes('.')){
    try{
      fs.mkdirSync(dirPath);
    }catch(e){}
  }
}

function isDir(filePath){
  let stat;
  try{
    stat = fs.statSync(filePath);
  }catch(e){}
  return stat && stat.isDirectory();
}

function isExist(filePath){
  let bol;
  try{
    fs.accessSync(filePath);
    bol = true;
  }catch(e){}
  return bol;
}


function deleteFile(filePath) {
  const fs = require('fs');
  return new Promise((cb, eb) => {
    if (isDir(filePath)) {
      deleteDir(filePath).then(cb,eb);
    } else {
      fs.unlink(filePath, (err) => err ? eb(err) : cb());
    }
  });
}


function deleteDir(dirname){
  const path = require('path');
  const fs = require('fs');
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
