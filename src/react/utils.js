/**
 * @file 全局方法
 * @author liubeijing
 */

/**
 * @description 打平 变成map，方便查找
 * @param {Array} children 注意：是指渲染后的组件实例集合，并不是指的虚拟dom
 * @return {Object} 集合
 */
export function flattenChildren(children = []) {
    const flattenChildren = {};

    children.forEach((child, index) => {
        const name = (child._currentElement && child._currentElement.key) || index;
        flattenChildren[name] = child;
    });

    return flattenChildren;
}

export function shouldUpdateReactCompent(prevEle, nextEle) {
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

export function html2Node(html) {
    const div = document.createElement('div');
    div.innerHTML = html;

    return div.children;
}
