/**
 * @file 组件挂载入口
 * @author liubeijing
 */
import ReactCompositeComponent from './ReactCompositeComponent';
import ReactDOMComponet from './ReactDOMComponet';
import ReactDOMTextComponet from './ReactDOMTextComponet';
// let nextReactRootId = window.nextReactRootId = 0;
// 实例化组件 工厂方法
export const instantiateReactComponent = (element) => {
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
};

export const render = (element, container) => {
    window.nextReactRootId = 0;
    const renderedCompenent = instantiateReactComponent(element);
    const markup = renderedCompenent.mountComponent(window.nextReactRootId++);
    const event = new CustomEvent('mount');
    window.dispatchEvent(event);

    container.innerHTML = markup;
};
