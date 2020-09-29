

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const pathUtil = require('./path');
const serverUtil = require('./util');
const {proParse} = require('@wangct/util');
const {resolve} = pathUtil;
const multer = require('multer');
const {pathFilename} = require("./path");
const {isDir} = require("./file");
const {BaseData,toAry} = require('@wangct/util');


class Server extends BaseData{

  constructor(options){
    super();
    this.setProps({
      html:'dist/index.html',
      port:8080,
      ...options,
    });
    this.init();
  }

  init(){
    this.createApp();
    this.addLog();
    this.addAssets();
    this.addUploadBodyParser();
    this.addBodyParser();
    this.addCookieParser();
    this.addSession();
    this.addRouter();
    this.addIndexHtml();
    this.start();
  }

  createApp(){
    this.app = express(this.server);
  }

  getApp(){
    return this.app;
  }

  addLog(){
    this.getApp().use((req,res,next) => {
      console.log('请求地址：' + req.url);
      next();
    });
  }

  addAssets() {
    const {assets,assetsPaths} = this;
    const app = this.getApp();
    toAry(assets).forEach(asset => {
      toAry(assetsPaths).forEach(assetsPath => {
        app.use(formatRouterPath(assetsPath),express.static(resolve(asset)));
      });
    });
  }

  getRouterByDirname(){
    const {routerDirname} = this;
    if(isDir(routerDirname)){
      return fs.readdirSync(routerDirname).map(fileName => {
        const filePath = resolve(routerDirname,fileName);
        return {
          path:formatRouterPath(pathFilename(fileName,false)),
          router:require(filePath),
        }
      });
    }
    return [];
  }

  addRouter() {
    const {routers = this.getRouterByDirname()} = this;
    const app = this.getApp();
    routers.forEach(router => {
      app.use(formatRouterPath(router.path),router.router);
    });
  }

  addBodyParser() {
    const app = this.getApp();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
  }

  addUploadBodyParser() {
    const upload = multer({
      dest: resolve('temp/multer')
    });
    this.getApp().use(upload.any());
  }

  addCookieParser() {
    this.getApp().use(cookieParser());
  }

  addSession() {
    this.getApp().use(session({
      secret:'wangct',
      name:'ssid',
      cookie:{},
      resave:false,
      saveUninitialized:true
    }));
  }

  addIndexHtml(){
    const {html} = this;
    if(!html){
      return;
    }
    this.getApp().use((req,res) => {
      res.sendFile(resolve(html));
    });
  }

  start(){
    const {port} = this;
    console.log(this);
    this.getApp().listen(port,'0.0.0.0',() => {
      console.log(`server is started`);
      console.log(`本地地址：http://${serverUtil.getLocalIp()}:${port}`);
    });
  }
}


module.exports = {
  sendRes,
  Server,
};

/**
 * 发送响应
 * @param res
 * @param data
 * @param err
 */
function sendRes(res,data,err){
  if(err){
    res.send({
      code:err.code || 500,
      message:getErrMsg(err)
    });
  }else{
    proParse(data).then(data => {
      res.send({
        code:0,
        data
      })
    }).catch(err => {
      console.log(err);
      res.send({
        code:err.code || 500,
        message:getErrMsg(err),
      });
    });
  }
}

/**
 * 获取错误信息
 * @param err
 * @returns {*}
 */
function getErrMsg(err){
  return err.message || err;
}

/**
 * 格式化地址
 * @param args
 * @returns {string}
 */
function formatRouterPath(...args){
  return path.join('/',...args).replace(/\\/g,'/')
}
