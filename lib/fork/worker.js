/**
 * Created by wangct on 2019/2/1.
 */

const {fork} = require('child_process');
const path = require('path');
const resolve = (...paths) => path.resolve(process.cwd(),...paths);
const util = require('@wangct/util');

/**
 * 工作者类
 */
class Worker{
    constructor(props){
        this.setProps(props);
        this.createTarget();
    }

    setProps(props){
        this.props = {
            freeCheckTime:100,
            callbackCache:new util.Cache(),
            ...props
        }
    }

    getProps(){
        return this.props;
    }

    createTarget(){
        const target = fork(resolve(__dirname,'exec'));
        target.on('message',data => {
            const callback = this.getCallback(data._id);
            delete data._id;
            util.callFunc(callback,data);
        });
        this.setTarget(target);
        this.initModule();
    }

    initModule(){
        this.initPromise = new Promise(cb => {
            this.sendFunc({type:'init',modulePath:resolve(this.getProps().path)},cb);
        });
    }

    setTarget(target){
        this.target = target;
    }

    getTarget(){
        return this.target;
    }

    setCallback(key,value){
        const {callbackCache} = this.getProps();
        callbackCache.setItem(key,value);
    }

    getCallback(key){
        const {callbackCache} = this.getProps();
        return callbackCache.getItem(key);
    }

    send(data,cb){
        this.initPromise.then(() => {
            this.sendFunc(data,cb);
        });
    }

    sendFunc(data,cb){
        const id = util.random();
        this.getTarget().send({
            ...data,
            _id:id
        });
        this.setCallback(id,cb);
    }
}


module.exports = Worker;
