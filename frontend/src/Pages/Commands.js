import React, {Component} from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  withRouter
} from "react-router-dom";

import Command from './Command';

class Commands extends Component {
	constructor(props) {
		super(props);
		this.state = {commands: this.props.commands, menu: false};
	}

	render() {
		return (
			<div className="App-commands">
				<div className="App-sidebar">
				<h3>Commands</h3>
	            {this.state.commands.map(c => {
	              return <Link className="App-link" to={`/commands/${c.name}`} key={c.name} >{c.name[0].toUpperCase()+c.name.slice(1)}</Link>
	            })}
	            </div>
				<div>
				<Switch>
				<Route path="/commands" exact render={(props) => {
					return (
						<div>
						<h1>Commands</h1>
						<p>Click a command on the sidebar to get started</p>
						</div>
					);
				}} />
				<Route path="/commands/:cmd" render={({match}) => <Command cmd = {this.state.commands.find(c => c.name == match.params.cmd)}/>} />
				</Switch>
				</div>
			</div>
		);
	}
}

export default withRouter(Commands);