const {resolve} = require("../lib");


module.exports = {
  getClientIp:[
    {
      i:[resolve('test')],
      o:['1','2','3'],
      oFunc:(item) => {
        item.then(d => {
          console.log(d);
        })
      }
    },
  ],
};
