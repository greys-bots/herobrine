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
		var config = await bot.utils.getConfig(bot, msg.guild.id);
		if(!config) config = {autopin: 2};
		if(args[0]) {
			var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
			var board;
			if(channel) board = await bot.utils.getStarboardByChannel(bot, msg.guild.id, channel.id);
			else board = await bot.utils.getStarboardByEmoji(bot, msg.guild.id, args[0].replace(/[<>]/g,""));
			if(!board) return msg.channel.createMessage("Board not found");

			var channel = msg.guild.channels.find(ch => ch.id == board.channel_id);
			if(!channel) {
				var scc = await bot.utils.deleteStarboard(bot, msg.guild.id, board.channel_id);
				if(scc) return msg.channel.createMessage("That starboard is not valid and has been deleted");
				else return msg.channel.createMessage("That starboard is not valid, but could not be deleted");
			}

			return msg.channel.createMessage({embed: {
				title: channel.name,
				fields: [
					{name: "Emoji", value: board.emoji.includes(":") ? `<${board.emoji}>` : board.emoji},
					{name: "Tolerance", value: board.tolerance ? board.tolerance : (config.autopin.tolerance || 2)},
					{name: "Moderator Override", value: board.override ? "Yes" : "No"},
					{name: "Message Count", value: board.message_count}
				],
				color: parseInt("5555aa", 16)
			}})
		}

		var boards = await bot.utils.getStarboards(bot, msg.guild.id);
		if(!boards || !boards[0]) return msg.channel.createMessage("No starboards registered for this server");
		
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

		if(embeds[0]) {
			var message = await msg.channel.createMessage(embeds[0]);
			if(embeds[1]) {
				if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
					user: msg.author.id,
					index: 0,
					data: embeds,
					timeout: setTimeout(()=> {
						if(!bot.menus[message.id]) return;
						try {
							message.removeReactions();
						} catch(e) {
							console.log(e);
						}
						delete bot.menus[message.id];
					}, 900000),
					execute: bot.utils.paginateEmbeds
				};
				["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
			}
		} else msg.channel.createMessage("No valid starboards exist");
		
		if(remove[0]) {
			var err;
			for(var i = 0; i < remove.length; i++) {
				var scc = await bot.utils.deleteStarboard(bot, msg.guild.id, remove[i].id);
				if(!scc) err = true;
			}

			if(err) msg.channel.createMessage("Some invalid boards couldn't be removed from the database");
			else msg.channel.createMessage("Invalid starboards have been deleted!");
		}
	},
	subcommands: {},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["ap", "autopins", "pinboard", "pb", "starboard", "sb"]
}

module.exports.subcommands.add = {
	help: ()=> "Adds a channel to the server's autopin config",
	usage: ()=> [" [channel] [:emoji:] - Adds channel and reaction config for the server."],
	desc: ()=> "The channel can be a channel ID, channel-name, or #mention. The emoji can be a custom one.",
	execute: async (bot, msg, args)=> {
		if(!args[1]) return msg.channel.createMessage("Please provide a channel and an emoji.");
		var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
		if(!channel) return msg.channel.createMessage("Channel not found");
		var emoji = args[1].replace(/[<>]/g,"");

		var board = await bot.utils.getStarboardByChannel(bot, msg.guild.id, channel.id);
		if(!board) board = await bot.utils.getStarboardByEmoji(bot, msg.guild.id, emoji);
		if(board) return msg.channel.createMessage("A board registered with that channel or emoji already exists");

		var scc = await bot.utils.addStarboard(bot, msg.guild.id, channel.id, emoji);
		if(scc) msg.channel.createMessage("Board registered!");
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["a","new"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes a channel from the server's autopin config",
	usage: ()=> [" [board] - Removes the channel's pin config."],
	desc: ()=> "The board can be a channel ID, channel-name, or #mention.",
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage("Please provide a channel to remove the config from");
		var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
		if(!channel) return msg.channel.createMessage("Channel not found");

		var board = await bot.utils.getStarboardByChannel(bot, msg.guild.id, channel.id);
		if(!board) return msg.channel.createMessage("Board not found");

		var scc = await bot.utils.deleteStarboard(bot, msg.guild.id, channel.id);
		if(scc) msg.channel.createMessage("Board deleted!");
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["r","delete"]
}

module.exports.subcommands.pin = {
	help: ()=> "Takes the pins in the current channel and pins them in the pinboard",
	usage: ()=> [" [board] - Processes pins in the current channel."],
	desc: ()=> "The board can be a channel ID, channel-name, or #mention.",
	execute: async (bot, msg, args)=> {
		if(!args[0]) return msg.channel.createMessage("Please provide a board to send messsages to");
		var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
		if(!channel) return msg.channel.createMessage("Channel not found");

		var board = await bot.utils.getStarboardByChannel(bot, msg.guild.id, channel.id);
		if(!board) return msg.channel.createMessage("Board not found");

		msg.channel.createMessage("Starring messages; this may take a while...");
		var messages = await msg.channel.getPins();
		for(var i = 0; i < messages.length; i++) {
			messages[i].addReaction(board.emoji.replace(/^:/,""));
		}
		msg.channel.createMessage("Done!");
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
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) cfg = {autopin: 2};
		var scc;
		if(!args[0]) {
			scc = await bot.utils.updateConfig(bot, msg.guild.id, {autopin: 2});
			if(scc) return msg.channel.createMessage("Global tolerance reset!");
			else return msg.channel.createMessage("Something went wrong");
		} else {
			var channel = msg.guild.channels.find(c => c.id == args[0].replace(/[<#>]/g,"") || c.name == args[0].toLowerCase());
			if(!channel && parseInt(args[0]) == NaN) return msg.channel.createMessage("Channel not found");
			else if(!channel && parseInt(args[0]) != NaN) {
				var scc = await bot.utils.updateConfig(bot, msg.guild.id, {autopin: args[0]});
				if(scc) return msg.channel.createMessage("Global tolerance set!");
				else return msg.channel.createMessage("Something went wrong");
			}
			var board = await bot.utils.getStarboardByChannel(bot, msg.guild.id, channel.id);
			if(!board) return msg.channel.createMessage("Board not found");
			
			scc = await bot.utils.updateStarboard(bot, msg.guild.id, channel.id, {tolerance: args[1]});
			if(scc) return msg.channel.createMessage(`Board tolerance ${args[1] ? "" : "re"}set!`);
			else return msg.channel.createMessage("Something went wrong");
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
				"a value of false will make mod reactions count the same as ",
				"member reactions"].join(""),
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage('Please provide a board and the value to set the override to');
		var channel = msg.guild.channels.find(ch => ch.name == args[0].toLowerCase() || ch.id == args[0].replace(/[<#>]/g,""));
		if(!channel) return msg.channel.createMessage("Channel not found");

		var board = await bot.utils.getStarboardByChannel(bot, msg.guild.id, channel.id);
		if(!board) return msg.channel.createMessage("Board not found");

		if(!["true", "1", "false", "0"].includes(args[1])) return msg.channel.createMessage("Please provide a valid value to set the override to")

		var scc = await bot.utils.updateStarboard(bot, msg.guild.id, channel.id, {override: ["true", "1"].includes(args[1]) ? true : false});
		if(scc) msg.channel.createMessage("Override set!")
		else msg.channel.createMessage("Something went wrong")
	}
}