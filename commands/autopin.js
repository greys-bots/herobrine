module.exports = {
	help: "Registers channel and reaction emoji for a server pinboard.",
	usage: [" add [chanName | chanID | #channel] [:emoji:] - Adds channel and reaction config.",
				" remove [chanName | chanID | #channel] - Removes channel config.",
				" view - Views current configs."],
	examples: ["hh!ap add test-chan :pushpin:","hh!ap remove test-chan", "hh!ap view"],
	subcommands: {},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["ap","autopins"]
}

module.exports.subcommands.add = {
	help: ()=> "Adds a channel to the server's autopin config",
	usage: ()=> [" [chanName | chanID | #channel] [:emoji:] - Adds channel and reaction config for the server."],
	desc: ()=> "The emoji can be a custom one.",
	execute: (bot, msg, args)=> {
		if(!args[0] || !args[1]) {
			return msg.channel.createMessage("Please provide a channel and an emoji.");
		}
		var chan;
		var emoji = args[1].replace(/[<>]/g,"");
		console.log(emoji);
		if(!msg.channelMentions[0]) {
			chan = msg.guild.channels.find(ch => ch.name == args[0] || ch.id == args[0]) || null;
			if(!chan) return msg.channel.createMessage("Channel not found.");
			else chan = chan.id;
		} else {
			chan = msg.channelMentions[0];
		}
		if(bot.server_configs[msg.guild.id] && bot.server_configs[msg.guild.id].autopin) {
			console.log(bot.server_configs[msg.guild.id].autopin);
			if(bot.server_configs[msg.guild.id].autopin.find(c => c.channel == (chan))) {
				return msg.channel.createMessage("Channel already configured.");
			} else if(bot.server_configs[msg.guild.id].autopin.find(c => c.emoji == emoji)) {
				return msg.channel.createMessage("Emoji already configured.");
			} else {
				bot.server_configs[msg.guild.id].autopin.push({channel: chan, emoji: emoji});
				bot.db.query(`UPDATE configs SET autopin=? WHERE srv_id=?`,[bot.server_configs[msg.guild.id].autopin,msg.guild.id],(err,res)=>{
					if(err) {
						console.log(err);
						return msg.channel.createMessage("Something went wrong.");
					}

					msg.channel.createMessage("Config saved.");
				})
			}
		} else {
			if(!bot.server_configs[msg.guild.id]) bot.server_configs[msg.guild.id] = {srv_id: srv, prefix: "", welcome: {}, autoroles: "", disabled: {}, opped: "", fedback: {}, logged: [], autopin: []};
			bot.server_configs.logged.push({channel: chan, emoji: emoji});
			bot.db.query(`UPDATE configs SET autopin=? WHERE srv_id=?`,[bot.server_configs.logged,msg.guild.id],(err,res)=>{
				if(err) {
					console.log(err);
					return msg.channel.createMessage("Something went wrong.");
				}

				msg.channel.createMessage("Config saved.");
			})
		}
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["a","new"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes a channel from the server's autopin config",
	usage: ()=> [" [chanName | chanID | #channel]- Removes the channel's pin config."],
	execute: (bot, msg, args)=> {
		if(!args[0]) {
			return msg.channel.createMessage("Please provide a channel to remove the configs from.");
		}
		var chan;
		if(!msg.channelMentions[0]) {
			chan = msg.guild.channels.find(ch => ch.name == args[0] || ch.id == args[0]) || null;
			if(!chan) return msg.channel.createMessage("Channel not found.");
			else chan = chan.id;
		} else {
			chan = msg.channelMentions[0];
		}
		if(bot.server_configs[msg.guild.id] && bot.server_configs[msg.guild.id].autopin) {
			console.log(bot.server_configs[msg.guild.id].autopin);
			if(bot.server_configs[msg.guild.id].autopin.find(c => c.channel == (chan))) {
				bot.server_configs[msg.guild.id].autopin = bot.server_configs[msg.guild.id].autopin.filter(c => c.channel != chan);
				bot.db.query(`UPDATE configs SET autopin=? WHERE srv_id=?`,[bot.server_configs[msg.guild.id].autopin, msg.guild.id], (err, res)=>{
					if(err) {
						console.log(err);
						return msg.channel.createMessage("Something went wrong.");
					}
					msg.channel.createMessage("Config removed.")
				});
			} else {
				msg.channel.createMessage("No config exists for that channel.")
			}
		} else {
			msg.channel.createMessage("No configs registered.")
		}
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["r","delete"]
}

module.exports.subcommands.pin = {
	help: ()=> "Takes the pins in the current channel and pins them in the pinboard",
	usage: ()=> [" [emoji] - Processes pins in the current channel."],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage("Please provide a channel.");
		if(bot.server_configs[msg.guild.id] && bot.server_configs[msg.guild.id].autopin) {
			var chan;
			if(!msg.channelMentions[0]) {
				chan = msg.guild.channels.find(ch => ch.name == args[0] || ch.id == args[0]) || null;
				if(!chan) return msg.channel.createMessage("Channel not found.");
				else chan = chan.id;
			} else {
				chan = msg.channelMentions[0];
			}
			if(chan && bot.server_configs[msg.guild.id].autopin.find(c => c.channel == chan)) {
				var cf = bot.server_configs[msg.guild.id].autopin.find(c => c.channel == chan);
				msg.channel.getPins().then(pins => {
					pins.map(p => {
						p.addReaction(cf.emoji.replace(/^:/,""));
					})
				})
			} else {
				msg.channel.createMessage("There are no pin configs for that channel.");
			}
		} else {
			msg.channel.createMessage(`There are no pin configs for this server.`);
		}
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["pins","process"]
}

module.exports.subcommands.view = {
	help: ()=> "Views the server's autopin config",
	usage: ()=> [" - Views the server's autopin config."],
	execute: async (bot, msg, args)=> {
		var chan;
		var embed = {
			title: "Autopin config",
			fields: []
		};
		var remove = false;
		if(bot.server_configs[msg.guild.id] && bot.server_configs[msg.guild.id].autopin) {
			await Promise.all(bot.server_configs[msg.guild.id].autopin.map(c => {
				chan = msg.guild.channels.find(ch => ch.id == c.channel);
				if(chan) {
					embed.fields.push({name: "Name: "+chan.name,
										value: "Emoji: "+(c.emoji.includes(":") ? `<${c.emoji}>` : c.emoji)});
					return new Promise(res => {
						setTimeout(()=>res(100), 100)
					})
				} else {
					remove = true;
					return new Promise(res => {
						setTimeout(()=>res(100), 100)
					})
				}
				
			})).then(()=> {
				msg.channel.createMessage({embed: embed});
			})

			if(remove) {
				bot.server_configs[msg.guild.id].autopin = bot.server_configs[msg.guild.id].autopin.filter(c => msg.guild.channels.find(ch => ch.id == c.channel));
				console.log(bot.server_configs[msg.guild.id].autopin)
				bot.db.query(`UPDATE configs SET autopin=? WHERE srv_id=?`,[bot.server_configs[msg.guild.id].autopin, msg.guild.id], (err, res)=>{
					if(err) {
						console.log(err);
						return msg.channel.createMessage("Something went wrong while removing invalid channels from config.");
					}
					msg.channel.createMessage("Found invalid channels while listing and removed them from the config.")
				});
			}
		} else {
			msg.channel.createMessage("No configs registered.")
		}
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["list","v","l"]
}