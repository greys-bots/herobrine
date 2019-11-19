module.exports = {
	help: ()=> "Add, remove, and list strikes given to people",
	usage: ()=> [" [user] - Lists all the user's current strikes and their IDs",
				 " add [user] <reason> - Add a strike to a user. If no reason is given, will default to 'No reason'",
				 " remove [user] [strikeID | all] - Removes the given strike from the user, or all strikes if 'all' is given as an argument"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a user to list strikes on");

		var user = msg.guild.members.find(m => m.id == args[0].replace(/[<@!>]/g, "") || (m.username + "#" + m.discriminator).toLowerCase() == args[0].toLowerCase());
		if(!user) return msg.channel.createMessage("Couldn't find that user");
		
		var strikes = await bot.utils.getStrikes(bot, msg.guild.id, user.id);
		if(!strikes || !strikes[0]) return msg.channel.createMessage("That user has no strikes");

		if(strikes.length <= 10) {
			msg.channel.createMessage({embed: {
				title: `Strikes for ${user.username}#${user.discriminator}`,
				description: `Current strike count: ${strikes.length}`,
				fields: strikes.map(s => {
					return {name: s.hid, value: s.reason}
				})
			}})
		} else {
			var embeds = await bot.utils.genEmbeds(bot, strikes, async s => {
				return {name: s.hid, value: s.reason}
			}, {
				title: `Strikes for ${user.username}#${user.discriminator}`,
				description: `Current strike count: ${strikes.length}`
			}, 10);

			var message = await msg.channel.createMessage(embeds[0]);

			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				data: embeds,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					message.removeReaction("\u2b05");
					message.removeReaction("\u27a1");
					message.removeReaction("\u23f9");
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			message.addReaction("\u2b05");
			message.addReaction("\u27a1");
			message.addReaction("\u23f9");
		}
	},
	subcommands: {},
	permissions: ["manageMembers"],
	alias: ["strike", "warn"],
	guildOnly: true,
	module: "admin"
}

module.exports.subcommands.add = {
	help: ()=> "Add strikes to a user",
	usage: ()=> [" [user] - Add a strike to a user, with '[no reason given]' listed as the reason",
				 " [user] [reason] - Adds a strike with the given reason"],
	desc: ()=> "The user argument can be an @mention, name#1234, or user ID.",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a user to add a strike to");

		var user = msg.guild.members.find(m => m.id == args[0].replace(/[<@!>]/g, "") || (m.username + "#" + m.discriminator).toLowerCase() == args[0].toLowerCase());
		if(!user) return msg.channel.createMessage("Couldn't find that user");

		var strikes = await bot.utils.getStrikes(bot, msg.guild.id, user.id) || [];

		var scc = await bot.utils.addStrike(bot, msg.guild.id, user.id, args[1] ? args.slice(1).join(" ") : "[no reason given]");
		if(scc) msg.channel.createMessage(`Strike added! New count: ${strikes.length + 1}`);
		else msg.channel.createMessage("Something went wrong");
	},
	alias: ["give", "+"],
	permissions: ["manageMembers"],
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: ()=> "Remove a(ll) strike(s) from a user",
	usage: ()=> [" [user] [strikeID] - Remove the given strike from the given user",
				 " [user] all - Remove all strikes from the given user",
				 " [user] * - Does the same as above"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a user to remove the strike(s) from, and a strike/scope to remove");

		var user = msg.guild.members.find(m => m.id == args[0].replace(/[<@!>]/g, "") || (m.username + "#" + m.discriminator).toLowerCase() == args[0].toLowerCase());
		if(!user) return msg.channel.createMessage("Couldn't find that user");

		var strikes = await bot.utils.getStrikes(bot, msg.guild.id, user.id);
		if(!strikes) return msg.channel.createMessage("User has no strikes; nothing to remove");

		var scc;
		if(["all", "*"].includes(args[1].toLowerCase())) scc = await bot.utils.deleteAllStrikes(bot, msg.guild.id, user.id);
		else scc = await bot.utils.deleteStrike(bot, msg.guild.id, user.id, args[1].toLowerCase());

		if(scc) msg.channel.createMessage(`Strike${["all", "*"].includes(args[1].toLowerCase()) ? "s" : ""} removed!`);
		else msg.channel.createMessage("Something went wrong");

	},
	alias: ["take", "delete", "-"],
	permissions: ["manageMembers"],
	guildOnly: true
}