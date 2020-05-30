/**
 * @file 文本组件类
 * @author liubeijing
 */
export default class ReactDOMTextComponet {
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