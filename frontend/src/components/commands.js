//commands
/*
 - Name + aliases
 - Description, permissions, module, guildonly
 - Usage/examples
 - Subcommands
*/

import React, {Component} from 'react';
import * as fetch from 'node-fetch';

import Command from './command';

class Commands extends Component {
	constructor(props) {
		super(props);
		this.state = {cmds: undefined};
	}

	async componentDidMount() {
		var cmds = await fetch('/commands');
		console.log(cmds);
		var cmds = await cmds.json();
		console.log(cmds);
		this.setState({cmds: cmds});
	}

	render() {
		var commands = this.state.cmds;
		return (
			<div className="App-commandsContainer">
	          <h2>Commands</h2>
	          <div className="App-command App-commandsHeader">
		          <div>
		          	<h3 style={{width: '50px'}}>Command</h3>
		          </div>
		          <div>
		          	<h3>Description and info</h3>
		          </div>
		          <div>
		          	<h3>Examples</h3>
		          </div>
	          </div>
	            {commands!=undefined ? commands.map((c, i) => {
	              return (
	                <Command key={i} cmd={c} />
	              )
	            }) : <tr><td>Loading...</td></tr>}
	        </div>
		);
	}
}

export default Commands;