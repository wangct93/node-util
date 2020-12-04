const isObject = require("@wangct/util/lib/typeUtil").isObject;
const isUndef = require("@wangct/util/lib/typeUtil").isUndef;

/**
 * 基础数据类
 */
class BaseData{

  setProps(key,value){
    const extProps = isObject(key) ? key : {[key]:value};
    this.props = {
      ...this.props,
      ...extProps,
    };
  }

  getProps(key){
    const {props = {}} = this;
    return key ? props[key] : props;
  }

}

exports.BaseData = BaseData;
