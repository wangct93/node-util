/**
 * Created by wangct on 2018/12/22.
 */
const chokidar = require('chokidar');
const {callFunc} = require('@wangct/util');
const {resolve} = require('./path');

/**
 * 监视文件夹
 */
class Watch{
    constructor(filePath,callback){
        this.filePath = filePath;
        this.callback = callback;
        this.init();
    }

    init(){
        this.setTarget();
        this.addEvent();
    }

    setTarget(){
        this.target = chokidar.watch(resolve(this.filePath));
    }

    getTarget(){
        return this.target;
    }

    onUpdate(...args){
        callFunc(this.callback,...args);
    }

    addEvent(){
        const target = this.getTarget();
        const {onUpdate} = this;
        target.on('ready',() => {
            target.on('add',onUpdate.bind(this,'add')).on('change',onUpdate.bind(this,'change')).on('unlink', onUpdate.bind(this,'unlink'));
        });
    }
}

/**
 * 监视文件夹方法
 * @param args
 * @returns {Watch}
 */
function watch(...args){
    return new Watch(...args);
}

module.exports = watch;
