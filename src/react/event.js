/**
 * @file 合成事件
 */
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
export default event; // eslint-disable-line