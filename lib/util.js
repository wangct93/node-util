/**
 * Created by wangct on 2018/12/22.
 */

const fs = require('fs');
const path = require('path');
const {util,objectUtil} = require('wangct-util');
const formidable = require('formidable');

module.exports = {
    mkdir,
    copyFile,
    formData,
    isDirectory,
    isExist,
    getLocalIp,
    getClientIp,
    send,
    sqlFormat
};

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

function copyFile(option) {
    const src = resolve(option.src);
    let {output, filePath = src} = option;
    output = output && resolve(output);
    const outputFilePath = output && path.join(output, path.relative(src, filePath));
    if (outputFilePath) {
        mkdir(outputFilePath);
    }
    const callback = (err) => {
        if (err) {
            console.log(err);
        }
        util.callFunc(option.success);
    };

    if (isDir(filePath)) {
        fs.readdir(filePath, (err, list) => {
            if (err) {
                callback(err);
            } else {
                util.queue({
                    list,
                    func(name, cb){
                        copyFile({
                            ...option,
                            src,
                            output,
                            filePath: path.join(filePath, name),
                            success: cb
                        });
                    },
                    success(){
                        callback();
                    }
                });
            }
        })
    } else {
        const {include, exclude, transform} = option;
        if ((include && !include(filePath)) || (exclude && exclude(filePath))) {
            callback();
        } else if (transform) {
            transform(filePath, outputFilePath, callback);
        } else if (outputFilePath && outputFilePath !== filePath) {
            const rs = fs.createReadStream(filePath);
            const ws = fs.createWriteStream(outputFilePath);
            rs.pipe(ws);
            ws.on('close', () => {
                callback();
            })
        } else {
            callback();
        }
    }
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

function sqlFormat(data){
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