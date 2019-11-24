import React, {Component} from 'react';

class Dashboard extends Component {
	constructor(props) {
		super(props);
		this.state = {commands: this.props.commands};
	}

	render() {
		return (
			<div className="App-dashboard">
				<h1>Dash testing</h1>
			</div>
		);
	}
}

export default Dashboard;