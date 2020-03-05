/**
 * Created by Administrator on 2018/6/7.
 */

const crypto = require('crypto');
const type = 'aes192';
const pwd = 'wangct';

module.exports = {
    encode,
    decode
};

/**
 * 编码
 * @param str
 * @returns {string}
 */
function encode(str){
    const cipher = crypto.createCipher(type,pwd);
    let encryptStr = cipher.update(str,'utf8','hex');
    encryptStr += cipher.final('hex');
    return encryptStr;
}

/**
 * 解码
 * @param hexStr
 * @returns {string}
 */
function decode(hexStr){
    const decipher = crypto.createDecipher(type,pwd);
    let decryptStr = decipher.update(hexStr,'hex','utf8');
    decryptStr += decipher.final('utf8');
    return decryptStr;
}
