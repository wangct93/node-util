/**
 * Created by wangct on 2018/12/22.
 */

const {logErr} = require("./log");
const {objForEach} = require('@wangct/util');
const {log} = require('./log');

module.exports = {
    getLocalIp,
    getClientIp,
    getOuterNetIp,
    proxyRequest,
    getReqBody,
    cbPromise,
  catchProErr,
};

/**
 * 代理请求
 * @param url
 * @param req
 * @param res
 * @returns {Promise<*>}
 */
function proxyRequest(url,req,res){
    const rs = require('request')(url,{
        method:req.method,
        headers:req.headers
    });
    res && rs.pipe(res);
    return rs;
}

/**
 * 获取本地ip
 * @returns {string}
 */
function getLocalIp() {
    const interfaces = require('os').networkInterfaces();
    let ip = '';
    objForEach(interfaces,(value) => {
        value && value.forEach(item => {
            if (item.family === 'IPv4' && item.address !== '127.0.0.1' && !item.internal) {
                ip = item.address;
            }
        })
    });
    return ip;
}

/**
 * 获取客户端ip
 * @param req
 * @returns {string}
 */
function getClientIp(req) {
    if(!req || !req.headers){
        return '';
    }
    const ips = req.headers['x-forwarded-for']
      || req.headers['x-wq-realip']
      || req.ip
      || req.connection.remoteAddress
      || req.socket.remoteAddress
      || req.connection.socket.remoteAddress
      || '';
    return ips.split(',')[0];
}

/**
 * 获取外网ip
 */
function getOuterNetIp(){
    return new Promise((cb,eb) => {
        require('request')('http://200019.ip138.com/',(err,res,body) => {
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

/**
 * 获取请求的数据
 * @returns {Promise<*>}
 */
async function getReqBody(req,options = {}) {

  return new Promise((cb, eb) => {
    let buf = Buffer.alloc(0);
    const {timeout = 60 * 1000} = options;
    let timer;

    function start() {
      clear();
      timer = setTimeout(() => {
        log('getReqBody超时');
        eb('timeout');
      }, timeout);
    }

    function clear() {
      clearTimeout(timer);
    }

    start();
    req.on('data', (chunk) => {
      start();
      buf = Buffer.concat([buf, chunk]);
    });
    req.on('end', () => {
      clear();
      cb(buf);
    });
    req.on('error', (err) => {
      clear();
      eb(err);
    });

  });
}

/**
 * 回调函数转promise
 * @param obj
 * @param funcName
 * @param args
 * @returns {Promise<any>}
 */
function cbPromise(obj,funcName,...args){
    return new Promise((cb,eb) => {
        if(obj[funcName]){
            obj[funcName](...args,(err,data) => {
                if(err){
                    eb(err);
                }else{
                    cb(data);
                }
            });
        }else{
            eb(funcName + '方法不存在');
        }
    })
}

function catchProErr(promise){
  return promise.catch((e) => {
    logErr(e);
  });
}
