
const path = require('path');


module.exports = {
  resolve
};

function resolve(...paths){
  return path.resolve(process.cwd(),...paths)
}