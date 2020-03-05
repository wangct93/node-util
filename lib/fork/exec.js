/**
 * Created by wangct on 2019/2/1.
 */
const {callFunc,isObj} = require('wangct-util');

let reducer = {};

/**
 * 进程获取到信息
 */
process.on('message',data => {
    const {type} = data;
    if(type === 'init'){
        updateReducer(data);
    }else if(type === 'checkFree'){
        resFree(data);
    }else{
        callFunc(reducer[type],data,resData => {
            resData = isObj(resData) ? resData : {message:resData};
            send({
                ...resData,
                _id:data._id
            });
        })
    }
});

/**
 * 更新reducer
 * @param data
 */
function updateReducer(data){
    reducer = require(data.modulePath);
    send(data);
}

/**
 * 发送信息
 * @param data
 */
function send(data){
    process.send(data);
}

/**
 * 返回空闲
 * @param data
 */
function resFree(data){
    send({
        ...data,
        result:true
    })
}
