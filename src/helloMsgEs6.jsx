/**
 * @file es6 写法
 */
// import React from 'react';
import React from './react';

export default class HelloMsgEs6 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: 'liubeijing',
            count: 1,
            visible: false,
            list: [
                {
                    name: '11111111',
                    key: 'aaaaa'
                },
                {
                    name: '222222',
                    key: 'aaaaawww'
                },
                {
                    name: '33333',
                    key: 'vvvvvv'
                }
            ]
        };
    }
    componentWillMount() {
        console.log('componentWillMount');
    }
    componentDidMount() {
        console.log('componentDidMount');
    }

    componentWillUpdate() {
        console.log('componentWillUpdate');
    }

    componentDidUpdate() {
        console.log('componentDidUpdate');
    }

    componentWillReceiveProps() {
        console.log('componentWillReceiveProps');
    }
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
            {/**数组渲染不出来？ */}
            <div><button onClick={() => {
                const list = Object.assign([], this.state.list);
                list.unshift(list.pop());
                this.setState({list});
                }}>改变顺序</button>
            </div>
            <ul>
                {
                    this.state.list.map(item => {
                        return (<li key={item.key}>
                            {item.name}
                        </li>);
                    })
                }
            </ul>
            <div><button onClick={() => {this.setState({name: this.state.name + '1'})}}>改变child的props</button></div>
            <Child name={this.state.name} />
        </div>);
    }
}

class Child extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentWillMount() {
        console.log('Child-componentWillMount');
    }
    componentDidMount() {
        console.log('Child-componentDidMount');
    }

    componentWillUpdate() {
        console.log('Child-componentWillUpdate');
    }

    componentDidUpdate() {
        console.log('Child-componentDidUpdate');
    }

    componentWillReceiveProps() {
        console.log('Child-componentWillReceiveProps');
    }

    render() {
        console.log(this.props);
        return (<div>child:{this.props.name}</div>);
    }
}