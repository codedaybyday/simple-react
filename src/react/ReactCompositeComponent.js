/**
 * @file 自定义组件类
 * @author liubeijing
 */
import {instantiateReactComponent} from './render';
import {_shouldUpdateReactCompent} from './utils';

export default class ReactCompositeComponent {
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