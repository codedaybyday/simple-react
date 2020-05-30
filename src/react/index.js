/**
 * @file 简单react
 * @author liubeijing
 */
import createClass from './createClass';
import createElement from './createElement';
import ReactClass from './ReactClass';
import {render} from './render';

const React = {
    nextReactRootId: 0,
    createClass,
    createElement,
    Component: ReactClass,
    render
};

export default React; // eslint-disable-line