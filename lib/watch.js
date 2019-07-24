/**
 * Created by wangct on 2018/12/22.
 */
const chokidar = require('chokidar');
const {callFunc} = require('wangct-util');
const {resolve} = require('./path');

class Watch{
    constructor(src,callback){
        this.src = src;
        this.callback = callback;
        this.create();
    }

    create(){
        this.setTarget();
        this.addEvent();
    }

    setTarget(){
        this.target = chokidar.watch(resolve(this.src));
    }

    getTarget(){
        return this.target;
    }

    addEvent(){
        const target = this.getTarget();
        const {callback = () => {}} = this;
        target.on('ready',() => {
            target.on('add',callback.bind(this,'add')).on('change',callback.bind(this,'change')).on('unlink', callback.bind(this,'unlink'));
        });
        callFunc(callback);
    }
}


function watch(...args){
    return new Watch(...args);
}

module.exports = watch;
