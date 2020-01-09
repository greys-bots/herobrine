module.exports = {
	help: ()=> "Set custom command aliases for the server",
	usage: ()=> [" - View registered aliases",
				 " [name] - Get info on an alias",
				 " add <name> <command> - Add a new alias. Runs a menu if sent with no arguments",
				 " remove [name] - Remove an alias",
				 " edit [name] - Runs a menu to edit an alias"],
	execute: async (bot, msg, args) => {
		if(args[0]) {
			var alias = await bot.utils.getAlias(bot, msg.guild.id, args[0].toLowerCase());
			if(!alias) return msg.channel.createMessage("Alias not found");

			return msg.channel.createMessage({embed: {
				fields: [
					{name: alias.name, value: alias.command}
				],
				color: parseInt("5555aa", 16)
			}})
		}

		var aliases = await bot.utils.getAliases(bot, msg.guild.id);
		if(!aliases || !aliases[0]) return msg.channel.createMessage("No aliases registered for this server");

		var embeds = await bot.utils.genEmbeds(bot, aliases, a => {
			return {name: a.name, value: a.command}
		}, {
			title: "Server Aliases",
			description: "Custom aliases and the commands they're mapped to",
			color: parseInt("5555aa", 16)
		})

		var message = await msg.channel.createMessage(embeds[0]);
		if(embeds[1]) {
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				data: embeds,
				index: 0,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					try {
						message.removeReactions();
					} catch(e) {
						console.log(e);
					}
					delete bot.menus[msg.author.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
		}
	},
	subcommands: {},
	alias: ["aliases", "al"],
	guildOnly: true,
	permissions: ["manageGuild"],
	module: "admin"
}

module.exports.subcommands.add = {
	help: ()=> "Add a new alias",
	usage: ()=> [" - Runs a menu to add an alias", 
				 " [name] [command] - Fast way to add an alias"],
	desc: ()=> ["Commands that the alias is for can also contain arguments. ",
				"Keep in mind that args given in the [command] portion of setting ",
				"an alias cannot be changed without editing the alias\n",
				"Also keep in mind that names can only be one word long, but ",
				"commands can be several (in order to account for subcommands and ",
				"arguments)"].join(""),
	execute: async (bot, msg, args)=> {
		var alias = args[0] || undefined;
		var command = args.slice(1).join(" ") || undefined;
		var exists;
		var resp;

		if(alias) exists = await bot.utils.getAlias(bot, msg.guild.id, alias);
		else {
			await msg.channel.createMessage("Enter a name for the alias. Note that this can only be one word long");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
			alias = resp[0].content.replace(" ","").toLowerCase();
			exists = await bot.utils.getAlias(bot, msg.guild.id, alias)
		}
		if(exists) return msg.channel.createMessage("Alias already exists. Mapped command: "+exists.command);

		exists = await bot.parseCommand(bot, msg, [alias]);
		if(exists.command) return msg.channel.createMessage("Command with that name already exists");

		if(command) exists = await bot.parseCommand(bot, msg, command.split(" "));
		else {
			await msg.channel.createMessage("Enter the command you want this alias to represent. This can include subcommands and even arguments");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
			command = resp[0].content;
			exists = await await bot.parseCommand(bot, msg, command.split(" "));
		}
		if(!exists.command) return msg.channel.createMessage("Command not found");

		var scc = await bot.utils.addAlias(bot, msg.guild.id, alias, command);
		if(scc) msg.channel.createMessage("Alias saved!");
		else msg.channel.createMessage("Something went wrong");
	},
	alias: ["register", "new", "a", "+"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes an alias",
	usage: ()=> [" [name] - Removes a registered alias"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage("Please provide an alias to remove.");

		var alias = await bot.utils.getAlias(bot, msg.guild.id, args[0].toLowerCase());
		if(!alias) return msg.channel.createMessage("Alias not found");

		var scc = await bot.utils.deleteAlias(bot, msg.guild.id, alias.name);
		if(scc) msg.channel.createMessage("Alias deleted!");
		else msg.channel.createMessage("Something went wrong");
	},
	alias: ["r", "rmv", "unregister", "-"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

module.exports.subcommands.edit = {
	help: ()=> "Edit an alias",
	usage: ()=> [" [name] - Edit the given alias. Runs a menu for it",
				 " [name] name [newname] - Renames the given alias",
				 " [name] command [new command] - Remaps the command for the given alias"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage("Please provide the alias to edit");

		var alias = await bot.utils.getAlias(bot, msg.guild.id, args[0].toLowerCase());
		if(!alias) return msg.channel.createMessage("Alias not found");

		var resp;
		var prop = args[1] || undefined;
		if(!prop) {
			await msg.channel.createMessage([
				"What would you like to change?",
				"```",
				"1 - name",
				"2 - command",
				"```"
			].join("\n"));
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
			if(resp[0].content.toLowerCase() == "1") prop = "name";
			else if(resp[0].content.toLowerCase() == "2") prop = "command";
			else return msg.channel.createMessage("ERR: invalid choice. Aborting");
		}
		if(!["name", "command"].includes(prop.toLowerCase())) return msg.channel.createMessage("ERR: invalid property. Valid properties: `name`, `command`");

		var data = {};
		var exists;
		switch(prop.toLowerCase()) {
			case "name":
				if(args[2]) data.name = args[2].toLowerCase();
				else {
					await msg.channel.createMessage("Enter the new value");
					resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
					if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
					data.name = resp[0].content.replace(" ","").toLowerCase();
				}
				exists = await bot.utils.getAlias(bot, msg.guild.id, data.name);
				if(exists && exists.id != alias.id) return msg.channel.createMessage("Alias already exists");
				exists = await bot.parseCommand(bot, msg, [data.name]);
				if(exists.command) return msg.channel.createMessage("Command with that name already exists");
				break;
			case "command":
				if(args[2]) data.command = args.slice(2).join(" ");
				else {
					await msg.channel.createMessage("Enter the new value");
					resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
					if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
					data.command = resp[0].content;
				}
				exists = await bot.parseCommand(bot, msg, data.command.split(" "));
				if(!exists.command) return msg.channel.createMessage("Command not found");
				break;
			default:
				return msg.channel.createMessage("ERR: invalid property. Valid properties: `name`, `command`");
				break;
		}
		var scc = await bot.utils.updateAlias(bot, msg.guild.id, alias.name, data);
		if(scc) msg.channel.createMessage("Alias updated!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	permissions: ["manageGuild"]
}