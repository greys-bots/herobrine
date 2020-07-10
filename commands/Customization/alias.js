module.exports = {
	help: ()=> "Set custom command aliases for the server",
	usage: ()=> [" - View registered aliases",
				 " [name] - Get info on an alias",
				 " add <name> <command> - Add a new alias. Runs a menu if sent with no arguments",
				 " remove [name] - Remove an alias",
				 " edit [name] - Runs a menu to edit an alias"],
	execute: async (bot, msg, args) => {
		if(args[0]) {
			var alias = await bot.stores.aliases.get(msg.guild.id, args[0].toLowerCase());
			if(!alias) return "Alias not found.";

			return {embed: {
				fields: [
					{name: alias.name, value: alias.command}
				],
				color: parseInt("5555aa", 16)
			}};
		}

		var aliases = await bot.stores.aliases.getAll(msg.guild.id);
		if(!aliases || !aliases[0]) return "No aliases registered for this server.";

		var embeds = await bot.utils.genEmbeds(bot, aliases, a => {
			return {name: a.name, value: a.command}
		}, {
			title: "Server Aliases",
			description: "Custom aliases and the commands they're mapped to",
			color: parseInt("5555aa", 16)
		})

		return embeds;
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

		if(alias) exists = await bot.stores.aliases.get(msg.guild.id, alias);
		else {
			await msg.channel.createMessage("Enter a name for the alias. Note that this can only be one word long");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
			if(!resp || !resp[0]) return "ERR: timed out. Aborting.";
			alias = resp[0].content.replace(" ","").toLowerCase();
			exists = await bot.stores.aliases.get(msg.guild.id, alias)
		}
		if(exists) return "Alias already exists. Mapped command: `"+exists.command+"`";

		exists = await bot.parseCommand(bot, msg, [alias]);
		if(exists.command) return "Command with that name already exists.";

		if(command) exists = await bot.parseCommand(bot, msg, command.split(" "));
		else {
			await msg.channel.createMessage("Enter the command you want this alias to represent. This can include subcommands and even arguments");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
			if(!resp || !resp[0]) return "ERR: timed out. Aborting.";
			command = resp[0].content;
			exists = await await bot.parseCommand(bot, msg, command.split(" "));
		}
		if(!exists.command) return "Command not found";

		try {
			await bot.stores.aliases.create(msg.guild.id, alias, {command});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Alias saved!";
	},
	alias: ["register", "new", "a", "+"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes an alias",
	usage: ()=> [" [name] - Removes a registered alias"],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return "Please provide an alias to remove.";

		var alias = await bot.stores.aliases.get(msg.guild.id, args[0].toLowerCase());
		if(!alias) return "Alias not found.";

		try {
			await bot.stores.aliases.delete(msg.guild.id, alias.name);
		} catch(e) {
			return "ERR: "+e;
		}

		return "Alias deleted!";
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
		if(!args[0]) return "Please provide the alias to edit.";

		var alias = await bot.stores.aliases.get(msg.guild.id, args[0].toLowerCase());
		if(!alias) return "Alias not found.";

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
			if(!resp || !resp[0]) return "ERR: timed out. Aborting.";
			if(resp[0].content.toLowerCase() == "1") prop = "name";
			else if(resp[0].content.toLowerCase() == "2") prop = "command";
			else prop = resp[0].content.toLowerCase();
		}
		if(!["name", "command"].includes(prop.toLowerCase())) return "ERR: invalid property. Valid properties: `name`, `command`";

		var data = {};
		var exists;
		switch(prop.toLowerCase()) {
			case "name":
				if(args[2]) data.name = args[2].toLowerCase();
				else {
					await msg.channel.createMessage("Enter the new value");
					resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
					if(!resp || !resp[0]) return "ERR: timed out. Aborting.";
					data.name = resp[0].content.replace(" ","").toLowerCase();
				}
				exists = await bot.stores.alaises.get(msg.guild.id, data.name);
				if(exists && exists.id != alias.id) return "Alias already exists.";
				exists = await bot.parseCommand(bot, msg, [data.name]);
				if(exists.command) return "Command with that name already exists.";
				break;
			case "command":
				if(args[2]) data.command = args.slice(2).join(" ");
				else {
					await msg.channel.createMessage("Enter the new value");
					resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
					if(!resp || !resp[0]) return "ERR: timed out. Aborting.";
					data.command = resp[0].content;
				}
				exists = await bot.parseCommand(bot, msg, data.command.split(" "));
				if(!exists.command) return "Command not found.";
				break;
			default:
				return "ERR: invalid property. Valid properties: `name`, `command`"
				break;
		}
		
		try {
			await bot.stores.aliases.update(msg.guild.id, alias.name, data);
		} catch(e) {
			return "ERR: "+e;
		}
		
		return "Alias updated!";
	},
	guildOnly: true,
	permissions: ["manageGuild"]
}