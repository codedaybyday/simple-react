/**
 * @file 创建虚拟节点
 * @author liubeijing
 */
import ReactElement from './ReactElement';

export default (type, config, ...children) => {
    const props = {
        children
    };
    const {key = null} = config;
    // const {key = Math.random()} = config; // @TODO:使用random 每次都不一样，是整个都刷新了，该方案不可行
    // const children = [];
    for (let key in config) {
        if (config.hasOwnProperty(key) && config[key]) {
            props[key] = config[key];
        }
    }
    console.log('createElement', key);
    // 生成一颗树。但是为啥不直接生成这样的？
    return new ReactElement(type, key, props);
};
