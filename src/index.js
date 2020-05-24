import React from './react';
// import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import * as serviceWorker from './serviceWorker';

const HelloMsg = React.createClass({
    getInitState() {
        return {
            name: 'liubeijing',
            count: 1,
            visible: false
        };
    },
    componentWillMount() {
        console.log('componentWillMount');
    },
    componentDidMount() {
        console.log('componentDidMount');
    },
    // render() {
    //     console.log('render', this.state);
    //     return React.createElement('div', {className: 'aaa', onClick: () => {
    //         this.setState({
    //             count: count + 1
    //         });
    //         console.log(this.state.name, this.state);
    //     }}, this.props.msg, <div>{this.state.name}</div>);
    // }
    render() {
        return (<div className="aaa">
            <div>
                计数器：{this.state.count}
                <button onClick={() => {this.setState({count: this.state.count + 1})}}>点击累积计数</button>
            </div>
            <div>
                <button onClick={() => {this.setState({visible: !this.state.visible})}}>切换显隐</button>
                {this.state.visible && <div>hhhhhhhhhhhhhhhh</div>}
            </div>
        </div>);
    }
});
// React.render(React.createElement('div', {className: 'aaa'}, 'hhhhh'),
//   document.getElementById('root')
// );

// 之前以为是直接传HelloMsg 还在疑惑怎么传props...createElement这么用就明白了
// React.render(
//     React.createElement(HelloMsg, {msg: 'hello world'}, null),
//     document.getElementById('root')
// );
React.render(
    <HelloMsg msg="hello world!"/>,
    document.getElementById('root')
);
// React.render(
//     'hello world',
//     document.getElementById('root')
// );

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
