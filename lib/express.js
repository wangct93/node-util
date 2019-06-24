

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const pathUtil = require('./path');
const serverUtil = require('./util');
const {util} = require('wangct-util');

const {resolve} = pathUtil;

module.exports = {
  createServer,
  send,
  sendPromise
};

function createServer(config){
  const {port,assets = [],assetsPaths = ['assets']} = config;
  const routerDirname = resolve(config.routerDirname || 'server/router');
  if(!port){
    throw new Error('port is undefined');
  }
  const app = express();
  assets.forEach(asset => {
    assetsPaths.forEach(assetsPath => {
      app.use(formatRouterPath(assetsPath),express.static(resolve(asset)));
    });
  });
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(session({
    secret:'wangct',
    name:'ssid',
    cookie:{},
    resave:false,
    saveUninitialized:true
  }));
  app.use((req,res,next) => {
    console.log('请求地址：' + req.url);
    next();
  });

  const routerList = fs.readdirSync(routerDirname);
  const apiRouter = express.Router();
  routerList.forEach(routerName => {
    const router = require(path.join(routerDirname,routerName));
    let {path:routerPath = path.basename(routerName,path.extname(routerName))} = router;
    routerPath = formatRouterPath(routerPath);
    app.use(routerPath,router);
    apiRouter.use(routerPath,router);
  });
  app.use('/api',apiRouter);
  app.use((req,res) => {
    res.sendFile(resolve(config.html || 'dist/index.html'));
  });
  app.listen(port,'0.0.0.0',() => {
    console.log(`server is started`);
    console.log(`本地地址：http://${serverUtil.getLocalIp()}:${port}`);
  });
  return app;
}




function send(res,data,err){
  if(err){
    res.send({success:false,message:err.message || err});
  }else{
    res.send({success:true,data});
  }
}

function sendPromise(res,promise){
  util.promise(promise).then(data => send(res,data)).catch(err => send(res,null,err));
}

function formatRouterPath(...args){
  return path.join('/',...args).replace(/\\/g,'/')
}
