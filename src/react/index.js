/**
 * @file 简单react
 */
let nextReactRootId = 0;
class ReactDOMTextComponet {
    constructor(text) {
        this._currentElement = text;
        this._inst = null;
        this._rootNodeId = null;
    }
    // 真正的挂载逻辑
    mountComponent(rootNodeId) {
        this._rootNodeId = rootNodeId;
        const markUp = `<span data-reactid=${this._rootNodeId}>${this._currentElement}</span>`;

        return markUp;
    }
    // 更新逻辑
    receiveComponent(rootNodeId) {

    }
}

class ReactDOMComponet {
    constructor(element) {
        this._rootNodeId = null;
        this._inst = null;
        this._currentElement = element;
        this._children = element.props.children;
    }

    mountComponent(rootNodeId) {
        this._rootNodeId = rootNodeId;
        let markUp = '';
        let props = Object.entries(this._currentElement.props).reduce((props, [key, val]) => {
            // 处理事件
            let match = /^on([\w]+)/.exec(key);
            if (key !== 'children' && !match) {
                props += ` ${key}=${val} `;
            }

            if (match) {
                document.addEventListener(match[1].toLocaleLowerCase(), (e) => {
                    const {path} = e;
                    // if (target.dataset.reactid === this._rootNodeId) {
                    //     typeof val === 'function' && val();
                    // }
                    // TODO:事件冒泡还没处理
                    path.forEach(ele => {
                        if (ele.dataset && ele.dataset.reactid == this._rootNodeId) {
                            typeof val === 'function' && val();
                        }
                    });
                }, false);
            }
            return props;
        }, '');

        let openTag = `<${this._currentElement.type} data-reactid=${this._rootNodeId} ${props}>`;
        let closeTag = `</${this._currentElement.type}>`;


        for (let i = 0; i < this._children.length; i++) {
            let child = this._children[i];
            let renderedCompenent = instantiateReactComponent(child);
            markUp += renderedCompenent.mountComponent(nextReactRootId++);
        }

        return openTag + markUp + closeTag;
    }
}

class ReactCompositeComponent {
    constructor(element) {
        const ReactClass = element.type;
        this._currentElement = new ReactClass(element.props); // props怎么传过来？
        this._currentElement._reactInternalInstance = this; // 把当前实例挂载在reactClass实例下面，setstate时候要用
        this._rootNodeId = null;
        this._inst = null;
    }

    mountComponent(rootNodeId) {
        this._rootNodeId = rootNodeId;
        const renderedElement = this._currentElement.render(); // 得到一堆虚拟dom
        const renderedCompenentInst = instantiateReactComponent(renderedElement);
        const markUp = renderedCompenentInst.mountComponent(nextReactRootId++);
        this._prevRenderedElement = renderedElement;
        this._inst = renderedCompenentInst; // render出来元素的实例

        // TODO:记得传参
        this._currentElement.componentWillMount && this._currentElement.componentWillMount();

        window.addEventListener('mount', () => {
            this._currentElement.componentDidMount && this._currentElement.componentDidMount();
        });
        return markUp;
    }

    receiveComponent(element, newState) {
        this._currentElement = element || this._currentElement;
        // 比较前后两次虚拟dom是否相同
        const prevRenderedElement = this._prevRenderedElement;
        const nextRenderedElement = this._currentElement.render();
        const nextProps = this._currentElement.props;
        const nextState = Object(this._currentElement.state, newState);
        const {componentWillUpdate, componentDidUpdate, shouldComponentUpdate} = this._currentElement;

        shouldComponentUpdate && shouldComponentUpdate(nextProps, nextState);
        componentWillUpdate && componentWillUpdate(nextProps, nextState);

        if (_shouldUpdateReactCompent(prevRenderedElement, nextRenderedElement)) {
            // this._inst.mountComponent(nextReactRootId++); // 怎么更新呢？
            this._inst.receiveComponent(nextRenderedElement, nextState); // nextState要不要传呢？？？

            componentDidUpdate && componentDidUpdate(nextProps, nextState);
            this._prevRenderedElement = nextRenderedElement; // 更新
        } else { // 类型完全不一样，需要删除
            this._inst = instantiateReactComponent(nextRenderedElement);
            const markUp = this._inst.mountComponent(this._rootNodeId);
            const ele = document.querySelector(`[data-reactid=${this._rootNodeId}]`);

            ele.parentNode && ele.parentNode.innerHTML(markUp);
        }
        // 更新属性和事件....
    }
}
// TODO:没太懂。。。场景没缕清
function _shouldUpdateReactCompent(prevEle, nextEle) {
    // 1
    // if (preEle.type !== nextEle.type || preEle.key !== nextEle.key) {
    //     return true;
    // }
    // retrun false;
    if (prevEle && nextEle) {
        const prevType = typeof prevEle.type;
        const nextType = typeof nextEle.type;
        // 这个逻辑有点绕,干嘛不用1处的逻辑
        if (['string', 'number'].includes(prevType)) {
            return ['string', 'number'].includes(nextType);
        } else {
            return nextType === 'object' && nextEle.type === prevEle.type && nextEle.key === prevEle.key;
        }
        // else if (
        //     prevType === 'object' &&
        //     typeof prevEle.type === 'function' &&
        //     typeof prevEle.key === 'string') { // 实际上是在比较key，type
        //     return nextType === 'object' && typeof nextEle.type === 'function' && typeof nextEle.key === 'string';
        // }
    }

    return false;

}
class ReactElement {
    constructor(type, key, props) {
        this.type = type;
        this.key = key;
        this.props = props;
    }
}
// 这玩意作用是啥捏？小小脑袋大大的疑惑
class ReactClass {
    constructor(props) {
        this.state = {};
    }

    render() {}

    setState(newState) {
        // this.state = Object(this.state, newState); // state合并放到receiveComponent
        this._reactInternalInstance.receiveComponent(null, newState); // 同步的 源码里面异步是怎么实现的？
    }
}
// 实例化组件 工厂方法
function instantiateReactComponent(element) {
    // const {type} = element;
    if (['string', 'number'].includes(typeof element)) { // 文本组件
        return new ReactDOMTextComponet(element);
    }

    // type哪来的？
    if (typeof element === 'object' && typeof element.type === 'string') {
        return new ReactDOMComponet(element);
    }

    if (typeof element === 'object' && typeof element.type === 'function') {
        return new ReactCompositeComponent(element);
    }
}
const React = {
    nextReactRootId: 0,
    // 生成虚拟节点
    createElement: (type, config, ...children) => {
        const props = {
            children
        };
        const {key = null} = config;

        for (let key in config) {
            if (config.hasOwnProperty(key) && config[key]) {
                props[key] = config[key];
            }
        }
        // 生成一颗树。但是为啥不直接生成这样的？
        return new ReactElement(type, key, props);
    },
    // 自定义组件 其实就是讲将一个类重新组装继承一下
    createClass: (spec) => {
        // props怎么传过去？？后续怎么实例化的
        class Constructor extends ReactClass {
            constructor(props) {
                super();
                this.props = props;
                this.state = this.getInitState ? this.getInitState() : null;
            }
        }
        // Constructor.prototype = new ReactClass();
        Object.assign(Constructor.prototype, spec); // 注入
        Constructor.prototype.constructor = Constructor;
        // 卧槽，返回的是个类，我一直以为是个实例！！
        return Constructor;
    },
    render: (element, container) => {
        const renderedCompenent = instantiateReactComponent(element);
        const markUp = renderedCompenent.mountComponent(nextReactRootId++);
        const event = new CustomEvent('mount');
        window.dispatchEvent(event);

        container.innerHTML = markUp;
    }
};

export default React;