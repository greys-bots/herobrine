module.exports = {
	help: ()=> "Set a custom command alias for the server",
	usage: ()=> [" - View registered aliases",
			" add <name> <command> - Add a new alias. Runs a menu if sent with no arguments",
			" remove [name] - Remove an alias",
			" edit [name] - Runs a menu to edit an alias"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg || !cfg.aliases || cfg.aliases.length == 0) return msg.channel.createMessage('No registered aliases found for this server.')

		if(cfg.aliases.length > 10) {
			var embeds = await bot.utils.genEmbeds(cfg.aliases, dat => {
				return {name: dat.alias, value: dat.cmdname}
			}, {
				title: "Aliases",
				description: "alias: command"
			});
			msg.channel.createMessage(embeds[0]).then(message => {
				if(!bot.pages) bot.pages = {};
				bot.pages[message.id] = {
					user: msg.author.id,
					index: 0,
					data: embeds
				};
				message.addReaction("\u2b05");
				message.addReaction("\u27a1");
				message.addReaction("\u23f9");
				setTimeout(()=> {
					if(!bot.pages[message.id]) return;
					message.removeReaction("\u2b05");
					message.removeReaction("\u27a1");
					message.removeReaction("\u23f9");
					delete bot.pages[msg.author.id];
				}, 900000)
			})
			
		} else {
			msg.channel.createMessage({ embed: {
				title: "Aliases",
				description: "alias: command",
				fields: cfg.aliases.map(s => {
					return {name: s.alias, value: s.cmdname}
				})
			}})
		}
	},
	subcommands: {},
	alias: ["aliases", "al"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

module.exports.subcommands.add = {
	help: ()=> "Add a new alias",
	usage: ()=> [" - Runs a menu to add an alias", " <name> <command> - Fast way to add an alias"],
	execute: async (bot, msg, args)=> {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		var aliases;
		if(!cfg) aliases = [];
		if(!cfg.aliases) aliases = [];
		else aliases = cfg.aliases;

		if(args[1]) {
			var name = args[0];
			var cmdname = args.slice(1);

			if(aliases[0] && aliases.find(a => a.alias == name || a.cmdname == cmdname.join(" "))) return msg.channel.createMessage("Alias already registered. Use `hh!alias edit [name]` to change it.");

			var cmd;

			try {
				cmd = await bot.parseCommand(bot, msg, [name])
				console.log(cmd[2])
			} catch(e) {
				cmd = undefined;
			}

			if(cmd) {
				console.log(cmd[2])
				return msg.channel.createMessage("Command with that name already exists");
			}

			try {
				cmd = await bot.parseCommand(bot, msg, cmdname)
			} catch(e) {
				return msg.channel.createMessage("Invalid command.")
			}
			aliases.push({alias: name, cmdname: cmd[2]})
			var sc = await bot.utils.updateConfig(bot, msg.guild.id, "aliases", aliases);
			if(sc) msg.channel.createMessage("Alias saved!");
			else msg.channel.createMessage("Something went wrong.");
		} else {
			msg.channel.createMessage("Please enter the alias. Note: you have 60 seconds to do this, and the alias will be one word (spaces will be stripped).\nType `cancel` to cancel any time.");
			msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:60000,maxMatches:1}).then(aname=>{
				if(aname[0]){
					aname = aname[0].content.toLowerCase();
					if(aname == "cancel") return msg.channel.createMessage("Action cancelled.")

					msg.channel.createMessage("Type the command name (the command without `hh!`) that you want to register the alias for. You have 60 seconds to do this.\nIf the alias is for a subcommand, .").then(()=>{
						msg.channel.awaitMessages( m => m.author.id == msg.author.id,{time:60000,maxMatches:1}).then(async cmdname=>{
							if(cmdname[0]){
								cmdname = cmdname[0].content.toLowerCase();
								if(cmdname=="cancel"){ return msg.channel.createMessage("Action cancelled.")}
								
								if(aliases[0] && aliases.find(a => a.alias == name || a.cmdname == cmdname.join(" "))) return msg.channel.createMessage("Alias already registered. Use `hh!alias edit [name]` to change it.");
								var cmd;

								try {
									cmd = await bot.parseCommand(bot, msg, [aname])
									console.log(cmd[2])
								} catch(e) {
									cmd = undefined;
								}

								if(cmd) {
									console.log(cmd[2])
									return msg.channel.createMessage("Command with that name already exists");
								}

								try {
									cmd = await bot.parseCommand(bot, msg, cmdname.split(" "))
								} catch(e) {
									return msg.channel.createMessage("Invalid command.")
								}

								aliases.push({alias: aname, cmdname: cmd[2]})
								var sc = await bot.utils.updateConfig(bot, msg.guild.id, "aliases", aliases);
								if(sc) msg.channel.createMessage("Alias saved!");
								else msg.channel.createMessage("Something went wrong.");
							} else {
								msg.channel.createMessage("Action cancelled.");
							}
						})
					});
				} else {
					console.log("Error: no message received");
					msg.channel.createMessage("Action cancelled.");
				}
			})
		}
	},
	alias: ["register", "a"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes an alias",
	usage: ()=> [" [name] - Removes a registered alias"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage("Please provide an alias to remove.");

		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("No config registered for the server.");
		if(!cfg.aliases) return msg.channel.createMessage("No aliases registered for the server.");

		cfg.aliases = cfg.aliases.filter(x => x.alias != args[0]);
		var sc = await bot.utils.updateConfig(bot, msg.guild.id, "aliases", cfg.aliases);
		if(sc) msg.channel.createMessage("Alias removed!");
		else msg.channel.createMessage("Something went wrong.");

	},
	alias: ["rem", "rmv", "unregister"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

module.exports.subcommands.edit = {
	help: ()=> "Edit an alias",
	usage: ()=> [" [name] - Edit the given alias. Runs a menu for it"],
	execute: async (bot, msg, args)=> {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.channel.createMessage("No config registered for this server.");
		if(!cfg.aliases[0]) return msg.channel.createMessage("No aliases registered for this server.");
		if(!cfg.aliases.find(x => x.alias == args[0].toLowerCase())) return msg.channel.createMessage("That alias doesn't exist.");
		var alias = cfg.aliases.findIndex(x => x.alias == args[0].toLowerCase());

		msg.channel.createMessage(["What would you like to edit?",'```',"1. Name","2. Command",'```'].join("\n"));

		var resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:60000,maxMatches:1})
		if(!resp[0]) return msg.channel.createMessage("Err: Timed out. Action cancelled.");
		resp = resp[0].content.toLowerCase();
		if(resp == "1" || resp == "name") {
			msg.channel.createMessage("Enter a new name for the alias. NOTE: spaces will be stripped.");
			var resp2 = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:60000,maxMatches:1})
			if(!resp2[0]) return msg.channel.createMessage("Err: Timed out. Action cancelled.");
			resp2 = resp2[0].content.toLowerCase();
			if(resp2 == "cancel") return msg.channel.createMessage("Action cancelled.");

			if(cfg.aliases[0] && cfg.aliases.find(a => a.alias == resp2)) return msg.channel.createMessage("Alias already registered.");

			var cmd;

			try {
				cmd = await bot.parseCommand(bot, msg, [name])
			} catch(e) {
				cmd = undefined;
			}

			if(cmd) {
				console.log(cmd[2])
				return msg.channel.createMessage("Command with that name already exists");
			}

			cfg.aliases[alias].alias = resp2;

			var sc = await bot.utils.updateConfig(bot, msg.guild.id, "aliases", cfg.aliases);
			if(sc) msg.channel.createMessage("Alias edited!");
			else msg.channel.createMessage("Something went wrong.");
		} else if(resp == "2" || resp == "command") {
			msg.channel.createMessage("Enter a new command for the alias. NOTE: spaces will be stripped.");
			var resp2 = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:60000,maxMatches:1})
			if(!resp2[0]) return msg.channel.createMessage("Err: Timed out. Action cancelled.");
			resp2 = resp2[0].content.toLowerCase();
			if(resp2 == "cancel") return msg.channel.createMessage("Action cancelled.");

			if(cfg.aliases[0] && cfg.aliases.find(a => a.cmdname == resp2)) return msg.channel.createMessage("Alias already registered.");

			var cmd;

			try {
				cmd = await bot.parseCommand(bot, msg, [name])
			} catch(e) {
				return msg.channel.createMessage("Invalid command.")
			}

			cfg.aliases[alias].cmdname = cmd[2];

			var sc = await bot.utils.updateConfig(bot, msg.guild.id, "aliases", cfg.aliases);
			if(sc) msg.channel.createMessage("Alias edited!");
			else msg.channel.createMessage("Something went wrong.");
		} else if(resp == "cancel") {
			return msg.channel.createMessage("Action cancelled.")
		} else {
			return msg.channel.createMessage("Invalid input; action cancelled.")
		}

	},
	guildOnly: true,
	permissions: ["manageGuild"]
}