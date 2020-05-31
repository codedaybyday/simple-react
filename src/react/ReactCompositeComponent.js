/**
 * @file 自定义组件类
 * @author liubeijing
 */
import {instantiateReactComponent} from './render';
import {shouldUpdateReactCompent} from './utils';

export default class ReactCompositeComponent {
    constructor(element) {
        const ReactClass = element.type;
        // @TODO:_currentElement应该和ReactDOMComponent中的_currentElement打平。不然每次diff类型不一样
        this._inst = new ReactClass(element.props); // props怎么传过来？
        this._inst._reactInternalInstance = this; // 把当前实例挂载在reactClass实例下面，setstate时候要用
        this._rootNodeId = null;
        this._currentElement = element;
    }

    mountComponent(rootNodeId) {
        this._rootNodeId = rootNodeId;
        const renderedElement = this._inst.render(); // 得到一堆虚拟dom
        const renderedCompenentInst = instantiateReactComponent(renderedElement);
        const markup = renderedCompenentInst.mountComponent(this._rootNodeId);
        this._prevRenderedElement = renderedElement;
        this._renderedCompenentInst = renderedCompenentInst; // render出来元素的实例
        const {componentWillMount, componentDidMount} = this._inst;

        // TODO:记得传参
        componentWillMount && componentWillMount();

        window.addEventListener('mount', () => {
            componentDidMount && componentDidMount();
        });
        return markup;
    }

    receiveComponent(element, newState) {
        const lastProps = this._currentElement.props;
        this._currentElement = element || this._currentElement;
        // 比较前后两次虚拟dom是否相同
        // const nextProps = element.props;
        const nextProps = this._currentElement.props;
        const nextState = Object.assign({}, this._inst.state, newState);
        this._inst.state = nextState;
        this._inst.props = nextProps;
        const prevRenderedElement = this._prevRenderedElement;
        const nextRenderedElement = this._inst.render();
        const {componentWillUpdate, componentDidUpdate, shouldComponentUpdate, componentWillReceiveProps} = this._inst;

        if (lastProps !== nextProps) {
            componentWillReceiveProps && componentWillReceiveProps(nextProps, nextState);
        }

        if (shouldComponentUpdate && !shouldComponentUpdate(nextProps, nextState)) {
            return;
        }

        componentWillUpdate && componentWillUpdate(nextProps, nextState);
        if (shouldUpdateReactCompent(prevRenderedElement, nextRenderedElement)) {
            this._renderedCompenentInst.receiveComponent(nextRenderedElement, nextState); // @TODO:nextState要不要传呢？？？
            componentDidUpdate && componentDidUpdate(nextProps, nextState);
            this._prevRenderedElement = nextRenderedElement; // 更新
        } else { // 类型完全不一样，需要删除
            this._renderedCompenentInst = instantiateReactComponent(nextRenderedElement);
            const markup = this._renderedCompenentInst.mountComponent(this._rootNodeId);
            const parentNode = document.querySelector(`[data-reactid="${this._rootNodeId}"]`);
            parentNode.parentNode.innerHTML = markup;
        }
    }
}
