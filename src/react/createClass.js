/**
 * @file 创建自定义组件
 * @author liubeijing
 */
import ReactClass from './ReactClass';

export default spec => {
    // props怎么传过去？？后续怎么实例化的
    class Component extends ReactClass {
        constructor(props) {
            super(props);
            this.props = props;
            this.state = this.getInitialState ? this.getInitialState() : null;
        }
    }
    // Constructor.prototype = new ReactClass();
    Object.assign(Component.prototype, spec); // 注入
    Component.prototype.constructor = Component;
    // 卧槽，返回的是个类，我一直以为是个实例！！
    return Component;
};
