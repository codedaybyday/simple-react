/**
 * @file 简单react
 * @author liubeijing
 */
import createClass from './createClass';
import createElement from './createElement';
import {render} from './render';

const React = {
    nextReactRootId: 0,
    createClass,
    createElement,
    render
};

export default React; // eslint-disable-line