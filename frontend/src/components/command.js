import React, {Component} from 'react';

class Command extends Component {
	constructor(props) {
		super(props);

		this.state = {cmd: this.props.cmd, show: false};
		this.ref = React.createRef();
	}

	toggleSubcommands() {
		if(this.state.cmd.data.subcommands) {
			if(!this.state.show) window.scrollTo(0, this.ref.current.offsetTop);
			this.setState({show: !this.state.show});
		}
	}

	render() {
		var show = this.state.show;
		var cmd = this.state.cmd;
		if(show) var subcommands = cmd.data.subcommands;
		
		return (
			<div ref={this.ref} className={`App-command ${show ? 'active' : ''}`} style={{cursor: cmd.data.subcommands ? 'pointer' : 'default'}} onClick={()=>this.toggleSubcommands()}>
			<div className="App-commandInner">
				<div>{cmd.name} (aliases: {cmd.data.alias ? cmd.data.alias.join(", ") : "[none]"})
				{cmd.data.subcommands &&
					<p>Click to toggle subcommands</p>
				}
				</div>
				<div dangerouslySetInnerHTML={{__html: 
											cmd.data.help +
											`<br/><br/>
											<div class='App-extras'>
											<span class='App-extra'><strong>Module:</strong> ${cmd.data.module || "unsorted"}</span>
                  							${cmd.data.permissions ?
                  								"<span class='App-extra'><strong>Permissions:</strong> "+cmd.data.permissions.join(', ')+"</span>" :
                  								""
                  							}
                  							${cmd.data.guildOnly ?
                  								"<span class='App-extra'><strong>Guild only</strong></span>" :
                  								""
                  							}
											</div>`
										}}>
											</div>
				<div dangerouslySetInnerHTML={{ __html: cmd.data.examples.join('<hr/>')}}></div>
			</div>
			{cmd.data.subcommands && Object.keys(cmd.data.subcommands).map(c => {
				var cm = {name: c, data: cmd.data.subcommands[c]};
				return(
					<div className="App-commandInner App-subcommand">
					<div>{cm.name} (aliases: {cm.data.alias ? cm.data.alias.join(", ") : "[none]"})</div>
					<div dangerouslySetInnerHTML={{__html: 
												cm.data.help +
												`<br/><br/>
												<div class='App-extras'>
												<span class='App-extra'><strong>Module:</strong> ${cm.data.module || cmd.data.module || "unsorted"}</span>
	                  							${cm.data.permissions ?
	                  								"<span class='App-extra'><strong>Permissions:</strong> "+cm.data.permissions.join(', ')+"</span>" :
	                  								""
	                  							}
	                  							${cm.data.guildOnly ?
	                  								"<span class='App-extra'><strong>Guild only</strong></span>" :
	                  								""
	                  							}
												</div>`
											}}>
												</div>
					<div dangerouslySetInnerHTML={{ __html: cm.data.examples.join('<hr/>')}}></div>
				</div>
				);
			})}
			</div>
		);
	}
}

export default Command;