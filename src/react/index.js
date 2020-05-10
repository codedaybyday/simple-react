/**
 * @file 简单react
 */
let nextReactRootId = 0;
// 实例化组件 工厂方法
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
        this._rootNodeId = null;
        this._inst = null;
    }

    mountComponent(rootNodeId) {
        this._rootNodeId = rootNodeId;
        const renderedElement = this._currentElement.render(); // 得到一堆虚拟dom
        const renderedCompenentInst = instantiateReactComponent(renderedElement);
        const markUp = renderedCompenentInst.mountComponent(nextReactRootId++);

        // TODO:记得传参
        this._currentElement.componentWillMount && this._currentElement.componentWillMount();

        window.addEventListener('mount', () => {
            this._currentElement.componentDidMount && this._currentElement.componentDidMount();
        });
        return markUp;
    }
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

    setState() {}
}
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