/**
 * Created by wangct on 2019/2/1.
 */
const {util} = require('wangct-util');

let reducer = {};

process.on('message',data => {
    const {type} = data;
    if(type === 'init'){
        updateReducer(data);
    }else if(type === 'checkFree'){
        resFree(data);
    }else{
        util.callFunc(reducer[type],data,resData => {
            resData = util.isObject(resData) ? resData : {message:resData};
            send({
                ...resData,
                _id:data._id
            });
        })
    }
});

function updateReducer(data){
    reducer = require(data.modulePath);
    send(data);
}

function send(data){
    process.send(data);
}

function resFree(data){
    send({
        ...data,
        result:true
    })
}