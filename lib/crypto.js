/**
 * Created by Administrator on 2018/6/7.
 */

const crypto = require('crypto');
const isNum = require("@wangct/util/lib/typeUtil").isNum;
const toStr = require("@wangct/util/lib/stringUtil").toStr;
const isStr = require("@wangct/util/lib/typeUtil").isStr;
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
function encode(str) {
  if(isNum(str)){
    str = toStr(str);
  }
  if(!isStr(str)){
    return str
  }
  const cipher = crypto.createCipher(type, pwd);
  let encryptStr = cipher.update(str, 'utf8', 'hex');
  encryptStr += cipher.final('hex');
  return encryptStr;
}

/**
 * 解码
 * @param hexStr
 * @returns {string}
 */
function decode(hexStr) {
  if(!isStr(hexStr)){
    return hexStr
  }
  const decipher = crypto.createDecipher(type, pwd);
  let decryptStr;
  try{
    decryptStr = decipher.update(hexStr, 'hex', 'utf8');
    decryptStr += decipher.final('utf8');
  }catch(e){
    decryptStr = hexStr;
  }
  return decryptStr;
}
