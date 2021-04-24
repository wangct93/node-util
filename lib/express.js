const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const pathUtil = require('./path');
const serverUtil = require('./util');
const {proParse} = require('@wangct/util');
const {resolve} = pathUtil;
const multer = require('multer');
const {logErr} = require("./log");
const fileIsExist = require("./file").fileIsExist;
const {pathResolve} = require("./path");
const toStr = require("@wangct/util/lib/stringUtil").toStr;
const toPromise = require("@wangct/util/lib/promiseUtil").toPromise;
const isFunc = require("@wangct/util/lib/typeUtil").isFunc;
const log = require("./log").log;
const {pathFilename} = require("./path");
const {isDir} = require("./file");
const {toAry} = require('@wangct/util');
const {BaseData} = require('./dataClass');

process.on('uncaughtException', (err) => {
  logErr(err);
});

/**
 * 服务类
 */
class Server extends BaseData{

  constructor(options){
    super();
    this.setProps({
      html:'dist/index.html',
      port:8080,
      autoStart:true,
      routerDirname:'server/router',
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
    this.addBeforeRouter();
    this.addRouter();
    this.addAfterRouter();

    if(this.getProps('autoStart')){
      this.start();
    }
  }

  createApp(){
    this.app = express(this.server);
  }

  getApp(){
    return this.app;
  }

  addLog(){
    this.getApp().use((req,res,next) => {
      log('请求地址：' + req.url);
      next();
    });
  }

  addAssets() {
    const {assets,assetsPaths} = this.getProps();
    const app = this.getApp();
    toAry(assets).forEach(asset => {
      toAry(assetsPaths).forEach(assetsPath => {
        app.use(formatRouterPath(assetsPath),express.static(resolve(asset)));
      });
    });
  }

  getRouterByDirname(){
    let {routerDirname} = this.getProps();
    routerDirname = resolve(routerDirname);
    if(isDir(routerDirname)){
      return require('fs').readdirSync(routerDirname).map(fileName => {
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
    const {routers = this.getRouterByDirname()} = this.getProps();
    const app = this.getApp();
    routers.forEach(router => {
      let {router:routerFunc} = router;
      if(!isFunc(routerFunc)){
        routerFunc = express.Router();
        Object.keys(router.router).forEach((key) => {
          const splitAry = key.split(' ');
          const method = splitAry.length > 1 ? splitAry[0].toLocaleLowerCase() : 'post';
          const routePath = splitAry.length > 1 ? splitAry[1] : splitAry[0];
          this.useUserValidator(routerFunc);
          routerFunc[method](formatRouterPath(routePath),(req,res,next) => {
            toPromise(router.router[key],req,res,next).then((data) => {
              const Stream = require('stream');
              if(data instanceof Stream){
                data.pipe(res);
              }else if(data instanceof Buffer){
                const stream = new Stream;
                const bufferStream = new stream.PassThrough();
                bufferStream.end(data);
                // require('fs').writeFileSync(pathResolve('test/b.mp3'),data);
                bufferStream.pipe(res);
              }else if(data !== null){
                sendRes(res,data);
              }
            }).catch((err) => {
              sendErrRes(res,err);
            });
          });
        });
      }
      app.use(formatRouterPath(router.path),routerFunc);
      app.use(formatRouterPath('/api',router.path),routerFunc);
    });
  }

  useUserValidator(router = this.getApp()){
    router.use((req,res,next) => {
      const {userInfo} = req.session;
      if(userInfo){
        next();
        return;
      }
      const exclude = this.getProp('userPathExclude');
      if(!exclude){
        next();
      }else{
        const bol = toAry(exclude).some((path) => {
          return req.url.replace(/^\/api/,'').startsWith(path);
        });
        if(bol){
          next();
        }else{
          sendErrRes(res,{
            code:-5,
            desc:'请登录',
          });
        }
      }
    });
  }

  addBeforeRouter(){
    const beforeRouter = this.getProp('beforeRouter');
    if(beforeRouter){
      this.getApp().use(beforeRouter);
    }
  }

  addAfterRouter(){
    const afterRouter = this.getProp('afterRouter');
    if(afterRouter){
      this.getApp().use(afterRouter);
    }
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
    this.getApp().use((req,res) => {
      const assets = [this.getProp('html'),...toAry(this.getProp('assets'))].map((path) => pathResolve(path));
      const filePath = assets.find((path) => fileIsExist(path));
      if(filePath){
        res.sendFile(filePath);
      }
    });
  }

  start(){
    const port = this.getProps('port');
    const app = this.getApp();
    this.addIndexHtml();
    app.use(catchErrorMiddleware);
    app.listen(port,'0.0.0.0',() => {
      log(`server is started`);
      log(`进程号：${process.pid}`);
      log(`本地地址：http://${serverUtil.getLocalIp()}:${port}`);
    });
  }
}


module.exports = {
  sendRes,
  sendErrRes,
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
    sendErrRes(res,err);
  }else{
    proParse(data).then((data) => {
      res.send({
        code:0,
        data
      });
    }).catch((err) => {
      sendErrRes(res,err);
    });
  }
}

/**
 * 响应返回错误
 * @author wangchuitong
 */
function sendErrRes(res,err = {}){
  log(err);
  res.send({
    code:err.code || 500,
    message:getErrMsg(err),
  });
}

/**
 * 获取错误信息
 * @param err
 * @returns {*}
 */
function getErrMsg(err){
  const message = toStr(err.message || err.desc || err);
  if(/\w/.test(message)){
    return '请求失败'
  }
  return message;
}

/**
 * 格式化地址
 * @param args
 * @returns {string}
 */
function formatRouterPath(...args){
  return require('path').join('/',...args).replace(/\\/g,'/')
}

/**
 * 捕捉错误中间件
 */
function catchErrorMiddleware(err,req,res,next){
  sendErrRes(res,err);
}
