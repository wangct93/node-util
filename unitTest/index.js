
const unitMap = require('./options');
const util = require('../lib');
startTest(unitMap);

/**
 * 开始测试
 * @param mapData
 */
function startTest(mapData){
  Object.keys(mapData).forEach((name) => {
    const caseList = mapData[name];
    if(!util[name]){
      return console.log(name + '该方法名不存在');
    }
    console.log('开始测试：',name);
    util.catchError(() => {
      const errAry = util.toAry(caseList).filter(({i,o,oFunc}) => {
        let result = util[name](...util.toAry(i));
        result = oFunc ? oFunc(result) : result;
        return !util.equal(result,o);
      });
      if(errAry.length){
        console.log(name,'测试失败，案例：',errAry[0]);
      }else{
        console.log('测试成功：',name);
      }
    }).catch(e => {
      console.log(name,'测试失败，错误：',e);
    });
  });
}
