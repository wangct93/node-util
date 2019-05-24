/**
 * Created by wangct on 2018/12/22.
 */

const fs = require('fs');
const path = require('path');
const wangctUtil = require('wangct-util');
const formidable = require('formidable');
const {util,objectUtil,arrayUtil} = wangctUtil;

module.exports = {
    mkdir,
    forEachFile,
    copyFile,
    formData,
    isDir,
    isExist,
    getLocalIp,
    getClientIp,
    send,
    formatSql,
    resolve
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
    const {format} = option;
    forEachFile(src,{
        ...option,
        execItem(filePath,cb){
            const outputFilePath = path.join(output, path.relative(src, filePath));
            if(isDir(filePath)){
                mkdir(outputFilePath);
                cb();
            }else{
                if(util.isFunc(format)){
                    format(filePath,outputFilePath,cb);
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

function formData(req,option,cb) {
    if (util.isFunc(option)) {
        cb = option;
        option = {};
    }
    option = {
        uploadDir: resolve('temp/form'),
        ...option
    };
    mkdir(option.uploadDir);
    const form = new formidable.IncomingForm();
    Object.keys(option).forEach(key => {
        form[key] = option[key];
    });
    form.parse(req, cb);
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

function send(res,data,err){
    if(err){
        res.send({success:false,message:err.message || err});
    }else{
        res.send({success:true,data});
    }
}

function formatSql(data){
    if(util.isDef(data)){
        if(util.isObject(data)){
            return Object.keys(data).map(key => {
                return `${key}=${sqlFormat(data[key])}`;
            }).join(' and ')
        }else{
            return `'${data.replace(/[\\'"]/g,(match) => '\\' + match)}'`;
        }
    }else{
        return `''`;
    }
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