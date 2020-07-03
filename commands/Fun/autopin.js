module.exports = {
	help: ()=> "Registers channel and reaction emoji for a server pinboard.",
	usage: ()=> [" - List registered starboards for the server",
				 " [channel | emoji] - Get info on a starboard registered with the given channel/emoji",
				 " add [chanName | chanID | #channel] [:emoji:] - Add channel and reaction config",
				 " remove [chanName | chanID | #channel] - Remove channel config",
				 " tolerance <board | number> <number> - Set the pin tolerance. Use `hh!help ap tolerance` for more info",
				 " override [board] [(true|1) | (false|0)] - Sets moderator override for a board"],
	desc: ()=> ["The moderator override determines if moderators can add things to the pinboard ",
				"without needing to hit the reaction tolerance, ",
				"\"moderators\" being those with the manageMessages permission.",
				"\nTolerance refers to how many reactions are needed to add a message to the board. ",
				"By default, this number is 2. The global tolerance will be used for boards without ",
				"their own specified tolerance."].join(""),
	execute: async (bot, msg, args)=> {
		var config = await bot.stores.configs.get(msg.guild.id);
		if(!config) config = {autopin: 2};
		if(args[0]) {
			var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
			var board;
			if(channel) board = await bot.stores.starboards.get(msg.guild.id, channel.id);
			else board = await bot.stores.starboards.getByEmoji(msg.guild.id, args[0].replace(/[<>]/g,""));
			if(!board) return msg.channel.createMessage("Board not found");

			var channel = msg.guild.channels.find(ch => ch.id == board.channel_id);
			if(!channel) {
				try {
					await bot.stores.starboards.delete(msg.guild.id, board.channel_id);
				} catch(e) {
					return "ERR while deleting invalid starboard: "+e;
				}

				return "That starboard is not valid and has been deleted.";
			}

			return {embed: {
				title: channel.name,
				fields: [
					{name: "Emoji", value: board.emoji.includes(":") ? `<${board.emoji}>` : board.emoji},
					{name: "Tolerance", value: board.tolerance ? board.tolerance : (config.autopin.tolerance || 2)},
					{name: "Moderator Override", value: board.override ? "Yes" : "No"},
					{name: "Message Count", value: board.message_count}
				],
				color: parseInt("5555aa", 16)
			}}
		}

		var boards = await bot.stores.starboards.getAll(msg.guild.id);
		if(!boards || !boards[0]) return "No starboards registered for this server.";
		
		var embeds = []
		var remove = [];

		for(var i = 0; i < boards.length; i++) {
			var channel = msg.guild.channels.find(ch => ch.id == boards[i].channel_id);
			if(channel) {
				embeds.push({embed: {
					title: channel.name,
					fields: [
						{name: "Emoji", value: boards[i].emoji.includes(":") ? `<${boards[i].emoji}>` : boards[i].emoji},
						{name: "Tolerance", value: boards[i].tolerance ? boards[i].tolerance : (config.autopin.tolerance || 2)},
						{name: "Moderator Override", value: boards[i].override ? "Yes" : "No"},
						{name: "Message Count", value: boards[i].message_count}
					],
					color: parseInt("5555aa", 16)
				}})
			} else remove.push({id: boards[i].channel});
		}

		if(remove[0]) {
			var err;
			for(var i = 0; i < remove.length; i++) {
				try {
					await bot.stores.starboards.delete(msg.guild.id, remove[i].id);
				} catch(e) {
					err = true;
				}
			}

			if(err) msg.channel.createMessage("Some invalid boards couldn't be removed from the database.");
			else msg.channel.createMessage("Invalid starboards have been deleted!");
		}

		if(embeds[0]) return embeds;
		else return "No valid starboards exist.";
	},
	subcommands: {},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["ap", "autopins", "pinboard", "pb", "starboard", "sb"]
}

module.exports.subcommands.add = {
	help: ()=> "Adds a channel to the server's autopin config.",
	usage: ()=> [" [channel] [:emoji:] <tolerance> - Adds channel and reaction config for the server. Tolerance is optional"],
	desc: ()=> "The channel can be a channel ID, channel-name, or #mention. The emoji can be a custom one.",
	execute: async (bot, msg, args)=> {
		if(!args[1]) return"Please provide a channel and an emoji.";
		var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
		if(!channel) return "Channel not found.";
		var emoji = args[1].replace(/[<>]/g,"");

		var board = await bot.stores.starboards.get(msg.guild.id, channel.id);
		if(!board) board = await bot.stores.starboards.getByEmoji(msg.guild.id, emoji);
		if(board) return "A board registered with that channel or emoji already exists.";

		try {
			await bot.stores.starboards.create(msg.guild.id, channel.id, emoji,
				{tolerance: args[2] && !isNaN(args[2]) ? parseInt(args[2]) : null});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Board registered!";
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["a","new"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes a channel from the server's autopin config.",
	usage: ()=> [" [channel] - Removes the channel's pin config"],
	desc: ()=> "The board can be a channel ID, channel-name, or #mention.",
	execute: async (bot, msg, args)=> {
		if(!args[1]) return"Please provide a channel and an emoji.";
		var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
		if(!channel) return "Channel not found.";
		var emoji = args[1].replace(/[<>]/g,"");

		var board = await bot.stores.starboards.get(msg.guild.id, channel.id);
		if(!board) return "Board not found.";

		try {
			await bot.stores.starboards.delete(msg.guild.id, channel.id);
		} catch(e) {
			return "ERR: "+e;
		}

		return "Board deleted!";
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["r","delete"]
}

module.exports.subcommands.pin = {
	help: ()=> "Takes the pins in the current channel and pins them in the pinboard.",
	usage: ()=> [" [board] - Processes pins in the current channel"],
	desc: ()=> "The board can be a channel ID, channel-name, or #mention.",
	execute: async (bot, msg, args)=> {
		if(!args[0]) return "Please provide a board to send messsages to.";
		var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
		if(!channel) return "Channel not found.";

		var board = await bot.stores.starboards.get(msg.guild.id, channel.id);
		if(!board) return "Board not found.";

		await msg.channel.createMessage("Starring messages; this may take a while...");
		var messages = await msg.channel.getPins();
		for(var i = 0; i < messages.length; i++) {
			await messages[i].addReaction(board.emoji.replace(/^:/,""));
		}
		return "Done!";
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["pins","process"]
}

module.exports.subcommands.tolerance = {
	help: ()=> "Set the tolerance for boards (or globally)",
	usage: ()=> [" - Reset global tolerance",
				 " [number] - Set global tolerance",
				 " [board] - Reset specific tolerance",
				 " [board] [number] - Set specific tolerance"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg) cfg = {autopin: 2};
		var scc;
		if(!args[0]) {
			try {
				await bot.stores.configs.update(msg.guild.id, {autopin: 2});
			} catch(e) {
				return "ERR: "+e;
			}

			return "Global tolerance reset!";
		} else {
			var channel = msg.guild.channels.find(c => c.id == args[0].replace(/[<#>]/g,"") || c.name == args[0].toLowerCase());
			if(!channel && isNaN(args[0])) return "Channel not found.";
			else if(!channel && !isNaN(args[0])) {
				try {
					await bot.stores.configs.update(msg.guild.id, {autopin: parseInt(args[0])});
				} catch(e) {
					return "ERR: "+e;
				}

				return "Global tolerance set!";
			}
			var board = await bot.stores.starboards.get(msg.guild.id, channel.id);
			if(!board) return "Board not found.";

			try {
				await bot.stores.starboards.update(msg.guild.id, channel.id, {tolerance: args[1] ? parseInt(args[1] : null)});
			} catch(e) {
				return "ERR: "+e;
			}

			return `Board tolerance ${args[1] ? "" : "re"}set!`;
		}
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["tol"]
}

module.exports.subcommands.override = {
	help: ()=> "Sets moderator override for adding items to the pinboard",
	usage: ()=> [" [board] [(true|1) | (false|0)] - Sets the board's override"],
	desc: ()=> ["A value resolving to TRUE will make it so that mods can ",
				"react to a post to immediately put it on the starboard; ",
				"a value of FALSE will make mod reactions count the same as ",
				"member reactions."].join(""),
	execute: async (bot, msg, args) => {
		if(!args[1]) return 'Please provide a board and the value to set the override to.';
		var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
		if(!channel) return "Channel not found.";

		var board = await bot.stores.starboards.get(msg.guild.id, channel.id);
		if(!board) return "Board not found.";

		if(!["true", "1", "false", "0"].includes(args[1])) return "Please provide a valid value to set the override to.";

		try {
			await bot.stores.starboards.update(msg.guild.id, channel.id, {override: ["true", "1"].includes(args[1]) ? true : false});
		} catch(e) {
			return "ERR: "+e;
		}
		
		return "Override set!";
	}
}