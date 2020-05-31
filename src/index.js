import React from './react';
// import React from 'react';
// import ReactDOM from 'react-dom';
import HelloMsgEs6 from './helloMsgEs6';
import HelloMsg from './helloMsg';
import './index.css';
import * as serviceWorker from './serviceWorker';
// import $ from 'jquery';

// React.render(React.createElement('div', {className: 'aaa'}, 'hhhhh'),
//   document.getElementById('root')
// );

// 之前以为是直接传HelloMsg 还在疑惑怎么传props...createElement这么用就明白了
// React.render(
//     React.createElement(HelloMsg, {msg: 'hello world'}, null),
//     document.getElementById('root')
// );


// React.render(
//     <HelloMsg msg="hello world!"/>,
//     document.getElementById('root')
// );

// -----------es6写法---------------------
React.render(
    <HelloMsgEs6 msg="hello world!"/>,
    document.getElementById('root')
);


// console.log('HelloMsg=>', Hell、oMsg);
// --------------自定义组件------------
// React.render(
//     <HelloMsg msg="hello world!"/>,
//     document.getElementById('root')
// );

// ----------文本组件------------------
// React.render(
//     'hello world',
//     document.getElementById('root')
// );
// --------------dom组件------------
// React.render(
//     <div>hello</div>,
//     document.getElementById('root')
// );
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
