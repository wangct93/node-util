/**
 * Created by wangct on 2018/12/22.
 */

const fs = require('fs');
const path = require('path');
const wangctUtil = require('wangct-util');
const formidable = require('formidable');
const request = require('request');
const {util,objectUtil,arrayUtil} = wangctUtil;

module.exports = {
    mkdir,
    forEachFile,
    copyFile,
    deleteFile,
    formData,
    isDir,
    isExist,
    getLocalIp,
    getClientIp,
    getOuterNetIp,
    send,
    sendPromise,
    resolve,
    closePort,
    portUseable
};

const {callFunc} = util;

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
        if(util.isFunc(execItem)){
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
                if(util.isFunc(transform)){
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

function formData(req,option) {
    return new Promise((cb,eb) => {
        option = {
            uploadDir: resolve('temp/form'),
            ...option
        };
        mkdir(option.uploadDir);
        const form = new formidable.IncomingForm();
        Object.keys(option).forEach(key => {
            form[key] = option[key];
        });
        form.parse(req, (err,fields,files) => {
            if(err){
                return eb(err);
            }
            cb({
                ...fields,
                ...files
            });
        });
    });
}


function getLocalIp() {
    const interfaces = require('os').networkInterfaces();
    let ip = '';
    objectUtil.forEach(interfaces,(value) => {
        value && value.forEach(item => {
            if (item.family === 'IPv4' && item.address !== '127.0.0.1' && !item.internal) {
                ip = item.address;
            }
        })
    });
    return ip;
}

function getClientIp(req) {
    const ips = req.headers['x-forwarded-for']
      || req.headers['x-wq-realip']
      || req.ip
      || req.connection.remoteAddress
      || req.socket.remoteAddress
      || req.connection.socket.remoteAddress
      || '';
    return ips.split(',')[0];
}

function getOuterNetIp(){
    return new Promise((cb,eb) => {
        request('http://200019.ip138.com/',(err,res,body) => {
            if(err){
                return eb(err);
            }
            const $ = require('cheerio').load(body);
            const title = $('title').text() || '';
            const ip = title.split('：')[1];
            ip ? cb(ip.trim()) : eb('获取ip失败');
        })
    })
}

function send(res,data,err){
    if(err){
        res.send({success:false,message:err.message || err});
    }else{
        res.send({success:true,data});
    }
}

function sendPromise(res,promise){
    promise.then(data => send(res,data)).catch(err => send(res,null,err));
}

function resolve(...paths){
    return path.resolve(process.cwd(),...paths)
}

function isValidPath(filePath,rule){
    if(util.isFunc(rule)){
        return rule(filePath);
    }else if(util.isRegExp(rule)){
        return rule.test(filePath);
    }else if(util.isArray(rule)){
        return rule.some(item => isValidPath(filePath,item))
    }else{
        return filePath.includes(rule);
    }
}

async function portUseable(port){
    const p1 = portUseableFunc(port);
    const p2 = portUseableFunc(port,true);
    const useable1 = await p1;
    const useable2 = await p2;
    return useable1 && useable2;
}


function portUseableFunc(port,useIp) {
    return new Promise(cb => {
        const http = require('http');
        const server = http.createServer().listen(port, useIp && '0.0.0.0',() => {
            server.close();
            cb(true);
        });
        server.on('error', () => {
            cb(false);
        });
    })
}


async function closePort(port){
    await tryClosePort(port).catch(() => {});
    const useable = await portUseable(port);
    if(!useable){
        throw new Error('关闭端口失败！');
    }
}

async function tryClosePort(port) {
    const {exec} = require('child_process');
    return new Promise((cb, eb) => {
        exec(`netstat -aon | findstr "${port}"`, (err, stdout) => {
            if (err) {
                eb(err);
                return;
            }
            let items = stdout.split('\n')[0].trim().split(/\s+/);
            let address = items[1];
            let pid = items[4];
            if (address.split(':')[1] !== port + '' || !pid || pid.length === 0) {
                eb('获取进程id失败');
                return;
            }
            exec(`taskkill /F /pid ${pid}`, (err) => {
                if (err) {
                    eb(err);
                    return false;
                }else{
                    cb(true);
                }
            });
        });
    })
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