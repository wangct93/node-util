/**
 * Created by wangct on 2018/12/23.
 */

const request = require('request');
const fs = require('fs');
const ws = fs.createWriteStream('test/a.wav');


request('https://tsn.baidu.com/text2audio',{
  method:'post',
  header:{

  },
  form:{
    tex:'测测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试试',
    tok:'24.e558edafde38b2b8fd01c51f77691461.2592000.1565018547.282335-16727634',
    cuid:'12345postman',
    ctp:'1',
    lan:'zh',
    spd:'5',
    vol:'5',
    per:'1',
    aue:'6'
  }
}).pipe(ws);