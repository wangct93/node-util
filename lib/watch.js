/**
 * Created by wangct on 2018/12/22.
 */
const chokidar = require('chokidar');
const path = require('path');
const resolve = (...paths) => path.resolve(process.cwd(),...paths);
const {util} = require('wangct-util');
class Watch{
    constructor(...args){
        const option = this.getArgsOption(...args);
        this.setProps(option);
        this.create();
    }

    getArgsOption(src,cb){
        return util.isObject(src) ? src : {
            src,
            callback:cb
        }
    }

    setProps(props){
        this.props = props;
    }

    getProps(){
        return this.props;
    }

    create(){
        this.setTarget();
        this.addEvent();
    }
    setTarget(){
        const {src} = this.getProps();
        this.target = chokidar.watch(resolve(src));
    }
    getTarget(){
        return this.target;
    }
    addEvent(){
        const target = this.getTarget();
        const {callback} = this.getProps();
        target.on('ready',() => {
            target.on('add',this.addTypeToCallback('add')).on('change',this.addTypeToCallback('change')).on('unlink', this.addTypeToCallback('unlink'));
        });
        util.callFunc(callback);
    }

    addTypeToCallback(type){
        const {callback} = this.getProps();
        return callback && callback.bind(this,type);
    }
}


function watch(...args){
    return new Watch(...args);
}

module.exports = watch;