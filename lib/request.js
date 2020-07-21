const util = require('util-1');

module.exports = request;

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
  return new Promise(async (cb,eb) => {
    options = {
      ...defaultOptions,
      ...options,
    };
    const httpMod = url.startsWith('https') ? https : http;
    const hasFormData = !!options.formData;
    const isPost = options.method.toLocaleString() === 'post';
    if(isPost && !hasFormData){
      options.headers = {
        'content-type': 'application/json',
        ...options.headers,
      };
    }
    const req = httpMod.request(url,options,cb);
    req.on('error',eb);
    if(hasFormData){
      await reqWriteFiles(req,options.body,options.formData);
    }else if(isPost && options.body){
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}


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
