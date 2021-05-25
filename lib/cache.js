
module.exports = {
  getConfig,
  setConfig,
}

let cacheConfig = {};
function setConfig(key,value){
  cacheConfig[key] = value;
}

function getConfig(key){
  return cacheConfig[key];
}
