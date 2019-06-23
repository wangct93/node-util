
const fs = require('fs');
const {util} = require('wangct-util');
const pathUtil = require('./path');

const {callFunc,isFunc,arrayUtil} = util;
const {resolve} = pathUtil;

module.exports = {
  forEachFile,
  copyFile,
  mkdir,
  isDir,
  isExist,
  deleteFile
};


function forEachFile(filePath,option){
  filePath = resolve(filePath);
  option = {...option};
  const {type,include,exclude} = option;
  const result = [];
  const success = (list = []) => {
    callFunc(option.success,result.concat(list));
  };
  const execItem = (cb) => {
    result.push(filePath);
    const {execItem} = option;
    if(isFunc(execItem)){
      execItem(filePath,() => {
        callFunc(cb);
      });
    }else{
      callFunc(cb);
    }
  };
  if(include && !isValidPath(filePath,include) || exclude && isValidPath(filePath,exclude)){
    return success();
  }

  const forEachFolder = () => {
    fs.readdir(filePath, (err, list = []) => {
      if(list.length){
        util.queue({
          list,
          func(name, cb){
            const subFilePath = path.join(filePath,name);
            forEachFile(subFilePath, {
              ...option,
              success: cb
            });
          },
          success(queueResult){
            queueResult = queueResult.reduce((pv,item) => pv.concat(item),[]);
            success(arrayUtil.noRepeat(queueResult).filter(item => !!item));
          }
        });
      }else{
        success();
      }
    })
  };
  const isDirBol = isDir(filePath);
  if(isDirBol && type !== 'file'){
    execItem(forEachFolder);
  }else if(!isDirBol && type !== 'folder'){
    execItem(success);
  }else if(isDirBol){
    forEachFolder()
  }else{
    success();
  }
}

function copyFile(option) {
  const src = resolve(option.src);
  const output = resolve(option.output);
  forEachFile(src,{
    ...option,
    execItem(filePath,cb){
      const outputFilePath = path.join(output, path.relative(src, filePath));
      if(isDir(filePath)){
        mkdir(outputFilePath);
        cb();
      }else{
        const {transform} = option;
        if(isFunc(transform)){
          transform(filePath,outputFilePath,cb);
        }else{
          const rs = fs.createReadStream(filePath);
          const ws = fs.createWriteStream(outputFilePath);
          rs.pipe(ws);
          ws.on('close',cb);
        }
      }
    }
  });
}

function mkdir(dirPath){
  dirPath = resolve(dirPath);
  const pathAry = path.dirname(dirPath).split(/[\\\/]/);
  pathAry.forEach((item,index) => {
    if(index){
      try{
        fs.mkdirSync(path.join(...pathAry.slice(0,index + 1)));
      }catch(e){}
    }
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


function isValidPath(filePath,rule){
  if(isFunc(rule)){
    return rule(filePath);
  }else if(util.isRegExp(rule)){
    return rule.test(filePath);
  }else if(util.isArray(rule)){
    return rule.some(item => isValidPath(filePath,item))
  }else{
    return filePath.includes(rule);
  }
}
