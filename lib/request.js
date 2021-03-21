const util = require('@wangct/util');
const {getReqBody} = require("./util");
const {strParse,stringify,objMap} = util;
const {log} = require('./log');

module.exports = {
  request,
};

const defaultOptions = {
  method:'get',
};

/**
 * 自定义请求
 * @param url
 * @param options
 * @returns {Promise<*>}
 */
async function request(url,options = {}){
  const http = require('http');
  const https = require('https');
  const pro = new Promise(async (cb,eb) => {
    options = {
      ...defaultOptions,
      ...options,
    };
    log('request地址：',url);
    if(!url){
      eb('地址不能为空');
      return null;
    }
    const httpMod = url.startsWith('https') ? https : http;
    const hasFormData = !!options.formData;
    const isPost = options.method.toLocaleString() === 'post';
    if(isPost && !hasFormData){
      options.headers = {
        'content-type': 'application/json',
        ...options.headers,
      };
    }
    const urlData = require('url').parse(url);
    let qsParams = strParse(urlData.query || '');
    qsParams = objMap(qsParams,(value) => encodeURIComponent(value));
    const req = httpMod.request(urlData.protocol + '//' + urlData.host + urlData.pathname + '?' + stringify(qsParams),options,(res) => {
      clearTimeout(timer);
      if(options.getRes){
        cb(res);
      }else{
        getReqBody(res).then(cb,eb);
      }
    });
    req.on('error',(err) => {
      clearTimeout(timer);
      eb(err);
    });
    if(hasFormData){
      await reqWriteFiles(req,options.body,options.formData);
    }else if(isPost && options.body){
      const writeData = options.headers['content-type'] === 'application/json' ? JSON.stringify(options.body) : options.body;
      req.write(writeData);
    }
    const {timeout = 60 * 1000} = options;
    const timer = setTimeout(() => {
      req.destroy('timeout');
      log('超时，request地址：',url);
      eb('timeout');
    },timeout);
    req.end();
  });
  pro.finally(() => {
    log('结束，request地址：',url);
  });
  return pro;
}

/**
 * 写请求内容
 * @param req
 * @param body
 * @param fileData
 * @returns {PromiseLike<T | never> | Promise<T | never>}
 */
function reqWriteFiles(req,body,fileData) {
  const fs = require('fs');
  const boundaryKey = (+new Date()).toString(36);
  const endSign = new Buffer('\r\n----' + boundaryKey + '--');
  const contentType = 'multipart/form-data; boundary=--' + boundaryKey;
  req.setHeader('Content-Type', contentType);
  Object.keys(body).forEach((field) => {
    req.write(new Buffer(`\r\n----${boundaryKey}\r\nContent-Disposition: form-data; name="${field}"\r\n\r\n${JSON.stringify(body[field])}`));
  });
  const files = Object.keys(fileData).reduce((pv,fileField) => {
    const file = fileData[fileField];
    const files = Array.isArray(file) ? file : [file];
    const formatFiles = files.map((file) => {
      return {
        ...file,
        field:fileField,
      };
    });
    return pv.concat(formatFiles);
  },[]);
  return util.onceQueue(files,(file) => {
    return new Promise((cb) => {
      req.write(new Buffer('\r\n----' + boundaryKey + '\r\n' +
        'Content-Type: application/octet-stream\r\n' +
        'Content-Disposition: form-data; name="' + file.field + '"; ' +
        'filename="' + file.name + '"; \r\n' +
        'Content-Transfer-Encoding: binary\r\n\r\n'));
      const rs = file.stream || fs.createReadStream(file.path);
      rs.on('end',cb);
      rs.pipe(req,{end: false});
    });
  }).then(() => {
    req.write(endSign);
  });
}
