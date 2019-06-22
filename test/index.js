/**
 * Created by wangct on 2018/12/23.
 */

const fs  = require('fs');
const path = require('path');
const util = require('../lib');


util.getOuterNetIp().then(d => {
  console.log(d);
});