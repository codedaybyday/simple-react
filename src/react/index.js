/**
 * @file 简单react
 * @author liubeijing
 */
import uuid from 'uuid';
let nextReactRootId = 0;
// 虚拟dom更新的类型
const UPDATE_TYPES = {
    MOVE_EXISTING: 1,
    REMOVE_NODE: 2,
    INSERT_MARKUP: 3
};
let _diffQueue = [];
let _updateDepth = 0;

const event = {
    listeners: {},
    addListener: (reactid, type, listener) => {
        if (!event.listeners[reactid]) {
            event.listeners[reactid] = {};
        }
        event.listeners[reactid][type] = listener;
        document.addEventListener(type, event.listeners[reactid][type]);
    },
    removeListener: (reactid, type) => {
        if (reactid === undefined || reactid === null || reactid === '') {
            throw new Error('reactid 必传！');
        }

        if (type) {
            document.removeEventListener(type, event.listeners[reactid][type]);
            delete event.listeners[reactid][type];
        } else {
            delete event.listeners[reactid];
        }
    }
};
class ReactDOMTextComponet {
    constructor(text) {
        this._currentElement = text;
        this._inst = null;
        this._rootNodeId = null;
    }
    // 真正的挂载逻辑
    mountComponent(rootNodeId) {
        this._rootNodeId = rootNodeId;
        const markup = `<span data-reactid=${this._rootNodeId}>${this._currentElement}</span>`;

        return markup;
    }
    // 更新逻辑
    receiveComponent(text) {
        if (text !== this._currentElement) {
            this._currentElement = text;
            document.querySelector(`[data-reactid="${this._rootNodeId}"]`).innerHTML = text;
        }
    }
}

class ReactDOMComponet {
    constructor(element) {
        this._rootNodeId = null;
        this._inst = null;
        this._currentElement = element;
        this._renderedChildren = [];
    }

    mountComponent(rootNodeId) {
        this._rootNodeId = rootNodeId;
        let markup = '';
        let props = Object.entries(this._currentElement.props).reduce((props, [key, val]) => {
            // console.log(key, val);
            if (!this._currentElement.props.hasOwnProperty(key)) {
                return props;
            }
            // 处理事件
            let match = /^on([\w]+)/.exec(key);
            if (key !== 'children' && !match) {
                props += ` ${key}=${val} `;
            }

            if (match) {
                // eventPool[this._rootNodeId][match[1].toLocaleLowerCase()] = (e) => {
                //     const {path} = e;
                //     // if (target.dataset.reactid === this._rootNodeId) {
                //     //     typeof val === 'function' && val();
                //     // }
                //     // TODO:事件冒泡还没处理
                //     path.forEach(ele => {
                //         if (ele.dataset && ele.dataset.reactid == this._rootNodeId) {
                //             typeof val === 'function' && val();
                //         }
                //     });
                // };
                event.addListener(this._rootNodeId, match[1].toLowerCase(), (e) => {
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
                });

                const type = match[1].toLowerCase();
                // document.addListenerEventListener(type, eventPool[this._rootNodeId][type], false);
                event.addListener(this._rootNodeId, type);
            }
            return props;
        }, '');

        let openTag = `<${this._currentElement.type} data-reactid=${this._rootNodeId} ${props}>`;
        let closeTag = `</${this._currentElement.type}>`;

        const _children = this._currentElement.props.children;
        console.log(_children);
        for (let i = 0; i < _children.length; i++) {
            let child = _children[i];
            let renderedCompenent = instantiateReactComponent(child);
            console.log('child, renderedCompenent', child, renderedCompenent);
            // 有可能是个bool
            if (renderedCompenent) {
                renderedCompenent._mountIndex = i;

                this._renderedChildren.push(renderedCompenent);

                markup += renderedCompenent.mountComponent(nextReactRootId++);
            }
        }

        return openTag + markup + closeTag;
    }

    receiveComponent(nextElement) {
        const props = this._currentElement.props;
        const nextProps = nextElement.props;

        this._updateDOMPropties(props, nextProps);
        // @TODO:有子元素为bool的情况，先暂时过滤掉，后续待优化
        this._updateDOMChildren(Array.prototype.filter.call(nextProps.children, child => !!child));
    }

    _updateDOMPropties(props, nextProps) {

        const node = document.querySelector(`[data-reactid="${this._rootNodeId}"]`);
        for (let name in nextProps) {
            // 实例上没有的时候
            if (!nextProps.hasOwnProperty(name)) {
                continue;
            }

            const eventMatch = /on([\w]+)/.exec(name);

            if (props[name] !== nextProps[name] && !eventMatch) {
                node.setAttribute(name, nextProps[name]); // 更新属性
            }

            if (eventMatch) {
                const type = eventMatch[1].toLowerCase();
                // document.removeListenerEventListener(type, eventPool[this._rootNodeId][type]);
                // document.addListenerEventListener(type, nextProps[eventMatch[1]]);
                event.removeListener(this._rootNodeId, type);
                event.addListener(this._rootNodeId, type, nextProps[eventMatch[1]]);
            }
        }

        for (let name in props) { // 没有的属性需要删除
            if (!props.hasOwnProperty(name)) {
                continue;
            }

            if (nextProps[name]) {
                node.removeAttribute(name);
            }
        }
    }

    _updateDOMChildren(nextChildElements) {
        _updateDepth++;
        this._diff(_diffQueue, nextChildElements);
        _updateDepth--;

        if (_updateDepth === 0) {
            this._patch(_diffQueue);
            _diffQueue = [];
        }
    }

    // @TODO:为啥不直接对比虚拟dom，还需要先对比component?
    _diff(_diffQueue, nextChildElements = []) {
        const prevChildren = _flattenChildren(this._renderedChildren);
        const nextChildren = _generateComponentChildren(prevChildren, nextChildElements);
        console.log('diff nextChildElements=>', nextChildElements);
        console.log('prevChildren=>', prevChildren);
        console.log('nextChildren=>', nextChildren);
        // 需要获取下一个children集合
        let nextIndex = 0;
        this._renderedChildren = [];
        Object.entries(nextChildren).forEach(([key, value]) => {
            // @TODO:顺序怎么保证？？？
            this._renderedChildren.push(value);
        });

        const parentNode = document.querySelector(`[data-reactid="${this._rootNodeId}"]`);
        for (let name in nextChildren) {
            if (!nextChildren.hasOwnProperty(name)) {
                continue;
            }
            const nextChild = nextChildren[name];
            const prevChild = prevChildren[name];

            // 比较component引用
            if (nextChild === prevChild) {
                _diffQueue.push({
                    type: UPDATE_TYPES.MOVE_EXISTING,
                    parentId: this._rootNodeId,
                    parentNode,
                    fromIndex: prevChild._mountIndex,
                    toIndex: nextIndex // @TODO:？？
                });
            } else {
                // 移除
                if (prevChild) {
                    _diffQueue.push({
                        type: UPDATE_TYPES.REMOVE_NODE,
                        parentId: this._rootNodeId,
                        parentNode,
                        fromIndex: prevChild._mountIndex,
                        toIndex: null
                    });
                    // @TODO:清理事件
                    event.removeListener(this._rootNodeId);
                }

                _diffQueue.push({
                    type: UPDATE_TYPES.INSERT_MARKUP,
                    parentId: this._rootNodeId,
                    parentNode,
                    fromIndex: null,
                    toIndex: nextIndex,
                    markup: nextChild.mountComponent(nextReactRootId++) // @TODO:为啥不直接传组件？
                });
            }

            nextIndex++;
        }

        for (let name in prevChildren) {
            const prevChild = prevChildren[name];
            // 老的有 新的没有 移出
            if (prevChildren.hasOwnProperty(name) && (nextChildren && !nextChildren.hasOwnProperty(name))) {
                _diffQueue.push({
                    type: UPDATE_TYPES.REMOVE_NODE,
                    parentId: this._rootNodeId,
                    parentNode,
                    fromIndex: prevChild._mountIndex,
                    toIndex: null
                });
                // @TODO:清理事件
                event.removeListener(this._rootNodeId);
            }
        }
        // 之前直接比较虚拟dom了.....
        // nextChildElements.forEach((nextChildElement, index) => {
        //     const name = nextChildElement.key || index;
        //     // const nextChildElement = ele;
        //     const prevChildElement = prevChildren[name];
        //     const parentNode = document.querySelector(`[data-reactid="${this._rootNodeId}]"`);
        //     console.log('nextChildElement', nextChildElement);

        //     // @TODO:不能直接比较引用，应该比较key和type
        //     if (nextChildElement === prevChildElement) {
        //         // 如果都有 说明只要移动就可以了
        //         _diffQueue.push({
        //             type: UPDATE_TYPES.MOVE_EXISTING,
        //             parentId: this._rootNodeId,
        //             parentNode,
        //             fromIndex: nextChildElement._mountIndex,
        //             toIndex: index // @TODO:？？
        //         });
        //     } else {
        //         // 移除
        //         if (prevChildElement) {
        //             _diffQueue.push({
        //                 type: UPDATE_TYPES.REMOVE_NODE,
        //                 parentId: this._rootNodeId,
        //                 parentNode,
        //                 fromIndex: prevChildElement._mountIndex,
        //                 toIndex: null
        //             });
        //         }

        //         if (nextChildElement) {
        //             _diffQueue.push({
        //                 type: UPDATE_TYPES.INSERT_MARKUP,
        //                 parentId: this._rootNodeId,
        //                 parentNode,
        //                 fromIndex: nextChildElement._mountIndex,
        //                 toIndex: index,
        //                 ele: nextChildElement
        //             });
        //         }
        //     }
        // });
    }

    _patch() {
        console.log('_diffQueue', _diffQueue);
        for (let i = 0; i < _diffQueue.length; i++) {
            const {parentNode, fromIndex, toIndex, type, markup} = _diffQueue[i] || {};
            const children = parentNode.children;
            switch (type) {
                case UPDATE_TYPES.MOVE_EXISTING:
                    // 交换位置？这种方法并不可行，需要操作实际的dom才行。MOVE_EXSTING事实上也是先移除再插入
                    // [children[toIndex], children[fromIndex]] = [children[fromIndex], children[toIndex]];
                    // @TODO:待优化，可以封装成insertAfter
                    if (toIndex + 1 <= children.length) {
                        parentNode.insertBefore(children[fromIndex], children[toIndex + 1]);
                    } else {
                        parentNode.appendChild(children[fromIndex].cloneNode(true));
                        children[fromIndex].remove();
                    }
                    break;
                case UPDATE_TYPES.REMOVE_NODE:
                    children[fromIndex].remove();
                    break;
                case UPDATE_TYPES.INSERT_MARKUP:
                    // const insertComponentInst = instantiateReactComponent();
                    // const markup = insertComponentInst.mountComponent(nextReactRootId++);
                    const child = _html2Node(markup)[0];
                    if (toIndex >= children.length) { // 从尾巴加添加
                        parentNode.appendChild(child);
                    } else {
                        // children[toIndex].insertBefore(child);
                        parentNode.insertBefore(child, children[toIndex]);
                    }
                    break;
                default:
                    break;
            }
        }
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
        const markup = renderedCompenentInst.mountComponent(this._rootNodeId);
        this._prevRenderedElement = renderedElement;
        this._inst = renderedCompenentInst; // render出来元素的实例
        console.log('renderedElement=>', renderedElement);
        console.log('this._currentElement=>', this._currentElement.render);

        // TODO:记得传参
        this._currentElement.componentWillMount && this._currentElement.componentWillMount();

        window.addEventListener('mount', () => {
            this._currentElement.componentDidMount && this._currentElement.componentDidMount();
        });
        return markup;
    }

    receiveComponent(element, newState) {
        this._currentElement = element || this._currentElement;
        // 比较前后两次虚拟dom是否相同
        const nextProps = this._currentElement.props;
        const nextState = Object.assign({}, this._currentElement.state, newState);
        this._currentElement.state = nextState;
        const prevRenderedElement = this._prevRenderedElement;
        const nextRenderedElement = this._currentElement.render();
        const {componentWillUpdate, componentDidUpdate, shouldComponentUpdate} = this._currentElement;


        if (shouldComponentUpdate && !shouldComponentUpdate(nextProps, nextState)) {
            return;
        }
        componentWillUpdate && componentWillUpdate(nextProps, nextState);

        console.log(prevRenderedElement, nextRenderedElement);
        if (_shouldUpdateReactCompent(prevRenderedElement, nextRenderedElement)) {
            // this._inst.mountComponent(nextReactRootId++); // 怎么更新呢？
            this._inst.receiveComponent(nextRenderedElement, nextState); // @TODO:nextState要不要传呢？？？

            componentDidUpdate && componentDidUpdate(nextProps, nextState);
            this._prevRenderedElement = nextRenderedElement; // 更新
        } else { // 类型完全不一样，需要删除
            this._inst = instantiateReactComponent(nextRenderedElement);
            const markup = this._inst.mountComponent(this._rootNodeId);
            const parentNode = document.querySelector(`[data-reactid="${this._rootNodeId}"]`);
            // console.log(ele, this._rootNodeId, nextReactRootId);
            // ele.parentNode && ele.parentNode.innerHTML(markup);
            console.log(this._rootNodeId, markup);
            parentNode.parentNode.innerHTML = markup;
        }
    }
}

/**
 * @description 打平 变成map，方便查找
 * @param {Array} children 注意：是指渲染后的组件实例集合，并不是指的虚拟dom
 * @return {Object} 集合
 */
function _flattenChildren(children = []) {
    const flattenChildren = {};

    children.forEach((child, index) => {
        const name = child._currentElement && child._currentElement.key || index;
        flattenChildren[name] = child;
    });

    return flattenChildren;
}
/**
 * @TODO:为啥要通过prevChildren 生成最新的nextChildElements集合呢？直接用遍历nextChildElements.mount不行么？
 * @param {object} prevChildren 旧的子元素生成的组件集合
 * @param {Array} nextChildElements 最新子元素（虚拟节点）
 */
function _generateComponentChildren(prevChildren, nextChildElements) {
    const nextChildren = {};

    nextChildElements.forEach((nextChildElement, index) => {
        const name = nextChildElement && nextChildElement.key || index;
        const prevChild = prevChildren[name];
        const prevChildElement = prevChild && prevChild._currentElement;

        console.log('prevChildElement', prevChildElement);
        console.log('nextChildElement', nextChildElement);

        console.log('_shouldUpdateReactCompent=>', _shouldUpdateReactCompent(prevChildElement, nextChildElement));
        if (_shouldUpdateReactCompent(prevChildElement, nextChildElement)) {
            prevChild.receiveComponent(nextChildElement);
            nextChildren[name] = prevChild;
        } else {
            const newChild = instantiateReactComponent(nextChildElement);
            nextChildren[name] = newChild;
        }
    });
    return nextChildren;
}
// TODO:没太懂。。。场景没缕清 判断时更新还是重新渲染
function _shouldUpdateReactCompent(prevEle, nextEle) {
    // 1
    // if (preEle.type !== nextEle.type || preEle.key !== nextEle.key) {
    //     return true;
    // }
    // retrun false;
    if (prevEle && nextEle) {
        const prevType = typeof prevEle;
        const nextType = typeof nextEle;
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

function _html2Node(html) {
    const div = document.createElement('div');
    div.innerHTML = html;

    return div.children;
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
        console.log('setState', newState);
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
    },
    // @TODO:跟es6写法有什么区别？
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
        const markup = renderedCompenent.mountComponent(nextReactRootId++);
        const event = new CustomEvent('mount');
        window.dispatchEvent(event);

        container.innerHTML = markup;
    }
};

export default React;