//commands
/*
 - Name + aliases
 - Description, permissions, module, guildonly
 - Usage/examples
 - Subcommands
*/

import React, {Component} from 'react';
import * as fetch from 'node-fetch';

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
	                <div className="App-command" key={i}>
	                  <div>{c.name} (aliases: {c.data.alias ? c.data.alias.join(", ") : "(none)"})</div>
	                  <div dangerouslySetInnerHTML={{__html: 
	                  							c.data.help +
	                  							`<br/><br/>
	                  							<div class='App-extras'>
	                  							<span class='App-extra'><strong>Module:</strong> ${c.data.module || "unsorted"}</span>
	                  							${c.data.permissions ?
	                  								"<span class='App-extra'><strong>Permissions:</strong> "+c.data.permissions.join(', ')+"</span>" :
	                  								""
	                  							}
	                  							<span class='App-extra'><strong>Guild only?</strong> ${c.data.guildOnly ? "Yes" : "No"}</span>
	                  							</div>`
	                  						}}>
	                  							</div>
	                  <div dangerouslySetInnerHTML={{ __html: c.data.examples.join('<br/>')}}></div>
	                </div>
	              )
	            }) : <tr><td>Loading...</td></tr>}
	        </div>
		);
	}
}

export default Commands;