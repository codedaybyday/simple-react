/**
 * @file 抽象虚拟节点类
 * @author liubeijing
 */
export default class ReactElement {
    constructor(type, key, props) {
        this.type = type;
        this.key = key;
        this.props = props;
    }
};