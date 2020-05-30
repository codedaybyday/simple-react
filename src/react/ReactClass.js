/**
 * @file react class
 * @author liubeijing
 */

export default class ReactClass {
    constructor(props) {
        this.state = {};
    }

    render() {}

    setState(newState) {
        // this.state = Object(this.state, newState); // state合并放到receiveComponent
        console.log('setState', newState);
        this._reactInternalInstance.receiveComponent(null, newState); // 同步的 源码里面异步是怎么实现的？
    }
}