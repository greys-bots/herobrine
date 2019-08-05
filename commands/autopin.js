module.exports = {
	help: ()=> "Registers channel and reaction emoji for a server pinboard.",
	usage: ()=> [" add [chanName | chanID | #channel] [:emoji:] - Add channel and reaction config",
				" remove [chanName | chanID | #channel] - Remove channel config",
				" view - View current configs",
				" config - Show current tolerance and override configurations",
				" tolerance [number] - Set global pin tolerance",
				" tolerance - Reset global pin tolerance",
				" tolerance [channel] [number] - Set tolerance for a specific board",
				" tolerance [channel] - Reset tolerance for a specific board",
				" override [(true|1)|(false|0)] - Sets moderator override"],
	desc: ()=> ["The moderator override determines if moderators can add things to the pinboard ",
				"without needing to hit the reaction tolerance, ",
				"'moderators' being those with the manageMessages permission.",
				"\nTolerance refers to how many reactions are needed to add a message to the board. ",
				"By default, this number is 2. The global tolerance will be used for boards without ",
				"their own specified tolerance."].join(""),
	execute: (bot, msg, args)=> {
		bot.commands.autopin.subcommands.view.execute(bot, msg, args);
	},
	subcommands: {},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["ap", "autopins", "pinboard", "pb", "starboard", "sb"]
}

module.exports.subcommands.add = {
	help: ()=> "Adds a channel to the server's autopin config",
	usage: ()=> [" [chanName | chanID | #channel] [:emoji:] - Adds channel and reaction config for the server."],
	desc: ()=> "The emoji can be a custom one.",
	execute: async (bot, msg, args)=> {
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
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(cfg && cfg.autopin) {
			console.log(cfg.autopin);
			if(cfg.autopin.boards.find(c => c.channel == (chan))) {
				return msg.channel.createMessage("Channel already configured.");
			} else if(cfg.autopin.boards.find(c => c.emoji == emoji)) {
				return msg.channel.createMessage("Emoji already configured.");
			} else {
				if(!cfg.autopin.boards) cfg.autopin.boards = [];
				cfg.autopin.boards.push({channel: chan, emoji: emoji});
				var sc = await bot.utils.updateConfig(bot, msg.guild.id, "autopin", cfg.autopin);
				if(sc) msg.channel.createMessage("Config saved")
				else msg.channel.createMessage("Something went wrong")
			}
		} else if(cfg && !cfg.autopin) {
			cfg.autopin = {};
			cfg.autopin.boards = [];
			cfg.autopin.boards.push({channel: chan, emoji: emoji});
			var sc = await bot.utils.updateConfig(bot, msg.guild.id, "autopin", cfg.autopin);
			if(sc) msg.channel.createMessage("Config saved")
			else msg.channel.createMessage("Something went wrong")
		} else {
			var sc = await bot.utils.updateConfig(bot, msg.guild.id, "autopin", {boards: [{channel: chan, emoji: emoji}]});
			if(sc) msg.channel.createMessage("Config saved")
			else msg.channel.createMessage("Something went wrong")
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
	execute: async (bot, msg, args)=> {
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
		var cfg = await bot.utils.getConfig(bot, msg.guild.id)
		if(cfg && cfg.autopin) {
			console.log(cfg.autopin);
			if(cfg.autopin.boards.find(c => c.channel == (chan))) {
				cfg.autopin.boards = cfg.autopin.boards.filter(c => c.channel != chan);
				var sc = await bot.utils.updateConfig(bot, msg.guild.id, "autopin", cfg.autopin);
				if(sc) msg.channel.createMessage("Config removed")
				else msg.channel.createMessage("Something went wrong")
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
		var cfg = await bot.utils.getConfig(bot, msg.guild.id)
		if(cfg && cfg.autopin) {
			var chan;
			if(!msg.channelMentions[0]) {
				chan = msg.guild.channels.find(ch => ch.name == args[0] || ch.id == args[0]) || null;
				if(!chan) return msg.channel.createMessage("Channel not found.");
				else chan = chan.id;
			} else {
				chan = msg.channelMentions[0];
			}
			if(chan && cfg.autopin.boards.find(c => c.channel == chan)) {
				var cf = cfg.autopin.boards.find(c => c.channel == chan);
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
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(cfg && cfg.autopin && cfg.autopin.boards[0]) {
			await Promise.all(cfg.autopin.boards.map(c => {
				chan = msg.guild.channels.find(ch => ch.id == c.channel);
				if(chan) {
					embed.fields.push({name: "Name: "+chan.name,
										value: "Emoji: "+(c.emoji.includes(":") ? `<${c.emoji}>` : c.emoji)+"Tolerance: "+(c.tolerance ? c.tolerance : (cfg.autopin.tolerance || 2))});
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
				cfg.autopin.boards = cfg.autopin.boards.filter(c => msg.guild.channels.find(ch => ch.id == c.channel));
				console.log(cfg.autopin.boards)
				await bot.utils.updateConfig(bot, msg.guild.id, "autopin", cfg.autopin);
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

module.exports.subcommands.config = {
	help: ()=> "Configure pinboard options",
	usage: ()=> [" - Show current configurations"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg || !cfg.autopin) return msg.channel.createMessage("No config registered for this server.");
		var ap = cfg.autopin;
		var embed = {
			title: "Pinboard config",
			fields: []
		}
		embed.fields.push({name: "Override", value: ap.override ? (ap.override) : "false"});
		embed.fields.push({name: "Global Tolerance", value: ap.tolerance ? ap.tolerance : 2})
		embed.fields.push({name: "Tolerance Overrides", value: ap.boards.filter(x => x.tolerance).map(b => `${(b.emoji.includes(":") ? `<${b.emoji}>` : b.emoji)} - ${b.tolerance}`).join("\n") || "(none)"})

		msg.channel.createMessage({embed: embed});
	},
	subcommands: {},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["cfg"]
}

module.exports.subcommands.tolerance = {
	help: ()=> "Set the tolerance for boards (or globally)",
	usage: ()=> [" [number] - Set global tolerance",
				 " - Reset global tolerance",
				 " [channel] [number] - Set specific tolerance",
				 " [channel] - Reset specific tolerance"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg || !cfg.autopin) return msg.channel.createMessage("No config registered for this server.");
		var ap = cfg.autopin || {};
		if(!args[1]) {
			if(!args[0]) {
				if(ap.tolerance) {
					delete ap.tolerance;
					var sc = await bot.utils.updateConfig(bot, msg.guild.id, "autopin", ap);
					if(sc) msg.channel.createMessage("Tolerance reset")
					else msg.channel.createMessage("Something went wrong")
				} else {
					msg.channel.createMessage("No global tolerance registered for this server.")
				}
			} else {
				var chan;
				if(!msg.channelMentions[0]) {
					chan = msg.guild.channels.find(ch => ch.name == args[0] || ch.id == args[0]) || null;
				} else {
					chan = msg.channelMentions[0];
				}
				if(!chan) { //assume this is setting the global tolerance
					if(parseInt(args[0]) == NaN) //Might've mistyped the channel
						return msg.channel.createMessage("Channel not found");
					else {
						ap.tolerance = parseInt(args[0]);
						var sc = await bot.utils.updateConfig(bot, msg.guild.id, "autopin", ap);
						if(sc) msg.channel.createMessage("Tolerance reset")
						else msg.channel.createMessage("Something went wrong")
					}
				} else {
					var cf = ap.boards.find(b => b.channel == chan);
					if(!cf) return msg.channel.createMessage("No config found for that channel.");
					else if(!cf.tolerance) return msg.channel.createMessage("No tolerance set for that board.");
					else {
						ap.boards.map(b =>{
							if(b.channel == chan) {
								delete b.tolerance;
								return b
							} else return b;
						})
						var sc = await bot.utils.updateConfig(bot, msg.guild.id, "autopin", ap);
						if(sc) msg.channel.createMessage("Tolerance reset")
						else msg.channel.createMessage("Something went wrong")
					}
				}
			}
		} else {
			var chan;
			if(!msg.channelMentions[0]) {
				chan = msg.guild.channels.find(ch => ch.name == args[0] || ch.id == args[0]) || null;
				if(!chan) return msg.channel.createMessage("Channel not found.");
				else chan = chan.id;
			} else {
				chan = msg.channelMentions[0];
			}
			var cf = ap.boards.find(b => b.channel == chan);
			if(!cf) return msg.channel.createMessage("No config found for that channel.");
			else {
				ap.boards.map(b =>{
					if(b.channel == chan) {
						b.tolerance = parseInt(args[1]);
						return b
					} else return b;
				})
				var sc = await bot.utils.updateConfig(bot, msg.guild.id, "autopin", ap);
				if(sc) msg.channel.createMessage("Board tolerance set")
				else msg.channel.createMessage("Something went wrong")
			}
		}
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["tol"]
}

module.exports.subcommands.override = {
	help: ()=> "Sets moderator override for adding items to the pinboard",
	usage: ()=> [" [(true|1)|(false|0] - Sets the override. Use 1, true, or enable to enable, false, 0, or disable to disable"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage('ERR: Missing argument');
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		var ap = cfg.autopin || {};

		if(args[0] == "true" || args[0] == "enable" || args[0] == "1") {
			ap.override = true;
		} else if(args[0] == "false" || args[0] == "disable" || args[0] == "0") {
			ap.override = false;
		} else {
			return msg.channel.createMessage("Invalid input.")
		}

		var sc = await bot.utils.updateConfig(bot, msg.guild.id, "autopin", ap);
		if(sc) msg.channel.createMessage("Override set")
		else msg.channel.createMessage("Something went wrong")

	}
}