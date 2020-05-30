/**
 * @file 标签组件类
 * @author liubeijing
 */
import {instantiateReactComponent} from './render';
import {_shouldUpdateReactCompent, _flattenChildren, _html2Node} from './utils';
import UPDATE_TYPES from './const';
import event from './event';
let _diffQueue = [];
let _updateDepth = 0;
// let nextReactRootId = window.nextReactRootId;

export default class ReactDOMComponet {
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
                event.addListener(this._rootNodeId, match[1].toLowerCase(), e => {
                    const {path} = e;
                    // if (target.dataset.reactid === this._rootNodeId) {
                    //     typeof val === 'function' && val();
                    // }
                    // TODO:事件冒泡还没处理
                    path.forEach(ele => {
                        if (ele.dataset && +ele.dataset.reactid === this._rootNodeId) {
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

                markup += renderedCompenent.mountComponent(window.nextReactRootId++);
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
        const nextChildren = this._generateComponentChildren(prevChildren, nextChildElements);
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
        let lastIndex = 0;
        for (let name in nextChildren) {
            if (!nextChildren.hasOwnProperty(name)) {
                continue;
            }
            const nextChild = nextChildren[name];
            const prevChild = prevChildren[name];
            // console.log(prevChild._mountIndex);
            // 比较component引用
            // @TODO:待优化，会出现很多fromIndex和toIndex相等的情况，事实上他们并不需要移动，影响性能
            if (nextChild === prevChild) {
                if (prevChild && lastIndex > prevChild._mountIndex) { // 为啥??
                    _diffQueue.push({
                        type: UPDATE_TYPES.MOVE_EXISTING,
                        parentId: this._rootNodeId,
                        parentNode,
                        fromIndex: prevChild._mountIndex,
                        toIndex: nextIndex // @TODO:？？
                    });
                }
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
                    markup: nextChild.mountComponent(window.nextReactRootId++) // @TODO:为啥不直接传组件？
                });
            }
            nextChild._mountIndex = nextIndex; // 记得更新，不然下次更新没有索引会报错
            nextIndex++;
            if (prevChild) {
                lastIndex = Math.max(lastIndex, prevChild._mountIndex);
            }
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
    /**
     * @TODO:为啥要通过prevChildren 生成最新的nextChildElements集合呢？直接用遍历nextChildElements.mount不行么？
     * @param {object} prevChildren 旧的子元素生成的组件集合
     * @param {Array} nextChildElements 最新子元素（虚拟节点）
     */
    _generateComponentChildren(prevChildren, nextChildElements) {
        const nextChildren = {};

        nextChildElements.forEach((nextChildElement, index) => {
            const name = (nextChildElement && nextChildElement.key) || index;
            const prevChild = prevChildren[name];
            const prevChildElement = prevChild && prevChild._currentElement;

            console.log('prevChildElement', prevChildElement);
            console.log('nextChildElement', nextChildElement);

            console.log('_shouldUpdateReactCompent=>', _shouldUpdateReactCompent(prevChildElement, nextChildElement));
            if (_shouldUpdateReactCompent(prevChildElement, nextChildElement)) {
                if (nextChildElement && prevChild) { // 注意不能为空 否则 nextChildren=> {0: undefined}
                    prevChild.receiveComponent(nextChildElement);
                    nextChildren[name] = prevChild;
                }
            } else if (nextChildElement) {
                const newChild = instantiateReactComponent(nextChildElement);
                if (newChild) {
                    nextChildren[name] = newChild;
                }
            }
        });
        return nextChildren;
    }
}