


// [accessKeyId] {String}：通过阿里云控制台创建的AccessKey。
// [accessKeySecret] {String}：通过阿里云控制台创建的AccessSecret。
// [stsToken] {String}：使用临时授权方式，详情请参见使用 STS 进行临时授权。
// [bucket] {String}：通过控制台或PutBucket创建的bucket。
// [endpoint] {String}：OSS域名。
// [region] {String}：bucket所在的区域， 默认oss-cn-hangzhou。
// [internal] {Boolean}：是否使用阿里云内网访问，默认false。比如通过ECS访问OSS，则设置为true，采用internal的endpoint可节约费用。
// [cname] {Boolean}：是否支持上传自定义域名，默认false。如果cname为true，endpoint传入自定义域名时，自定义域名需要先同bucket进行绑定。
// [isRequestPay] {Boolean}：bucket是否开启请求者付费模式，默认false。具体可查看请求者付费模式。
// [secure] {Boolean}：(secure: true)则使用HTTPS，(secure: false)则使用HTTP，详情请查看常见问题。
// [timeout] {String|Number}：超时时间，默认60s。


const Oss = require('ali-oss');
const {BaseData} = require("./dataClass");

class AliOss extends BaseData{
  constructor(options){
    super();
    this.setProps(options);
    this.initClient();
  }

  initClient(){
    this.setClient(new Oss(this.getProp()))
  }

  setClient(client){
    this.client = client;
  }

  getClient(){
    return this.client;
  }

  async getList(...args){
    return this.getClient().list(...args);
  }

  async put(...args){
    return this.getClient().put(...args);
  }

  async get(...args){
    return this.getClient().get(...args).then((data) => data.content);
  }

  async delete(...args){
    return this.getClient().delete(...args);
  }

  getUrl(...args){
    return this.getClient().signatureUrl(...args);
  }

}

module.exports = {
  AliOss,
};
