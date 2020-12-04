const {deleteFile} = require("../lib/file");
const {eachFile} = require("../lib/file");


const {Server} = require('../lib');

new Server({
  port:9555,
});
