/**
 * Created by wangct on 2018/12/23.
 */
module.exports = {
    log:(data,send) =>{
        const t = +new Date();
        while(+new Date() - t < 3000){

        }
        send('ddd');
    }
};