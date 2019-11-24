import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';

class Command extends Component {
	constructor(props) {
		super(props);
		this.state = {command: this.props.cmd};
	}

	render() {
		return (
			<div className="App-command" dangerouslySetInnerHTML={{__html: this.state.command.data}} />
		);
	}
}

export default Command;