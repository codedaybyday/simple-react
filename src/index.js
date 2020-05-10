import React from './react';
// import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import * as serviceWorker from './serviceWorker';

const HelloMsg = React.createClass({
    getInitState() {
        return {
            name: 'liubeijing'
        };
    },
    componentWillMount() {
        console.log('组件即将渲染');
    },
    componentDidMount() {
        console.log('组件已经渲染');
    },
    render() {
        return React.createElement('div', {className: 'aaa', onClick: () => {
            this.setState({
                name: 'ligoudan'
            });
            console.log(this.state.name);
        }}, this.props.msg);
    }
});
// React.render(React.createElement('div', {className: 'aaa'}, 'hhhhh'),
//   document.getElementById('root')
// );

// 之前以为是直接传HelloMsg 还在疑惑怎么传props...createElement这么用就明白了
React.render(
    React.createElement(HelloMsg, {msg: 'hello world'}, null),
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
