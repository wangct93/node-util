
const path = require('path');


module.exports = {
  resolve,
  joinPath
};

function resolve(...paths){
  return path.resolve(process.cwd(),...paths);
}

function joinPath(...paths){
  return path.join(...paths).replace(/\\/g,'/');
}
