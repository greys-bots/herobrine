module.exports = {
	help: ()=> "Add, remove, and list strikes given to people",
	usage: ()=> [" - Lists all strikes that have been given in the server",
				 " [user] - Lists all the user's current strikes and their IDs",
				 " [hid] - Gets a specific strike",
				 " add [user] <reason> - Add a strike to a user. If no reason is given, will default to 'No reason'",
				 " remove [user] [strikeID | all] - Removes the given strike from the user, or all strikes if 'all' is given as an argument"],
	execute: async (bot, msg, args) => {
		if(!args[0]) {
			var strikes = await bot.stores.strikes.getAll(msg.guild.id);
			if(!strikes || !strikes[0]) return "No strikes found for this server";
			var users = [...new Set(strikes.map(s => s.user_id))];
			console.log(users);

			var embeds = [];
			for(var i = 0; i < users.length; i++) {
				var user = await bot.utils.fetchUser(bot, users[i]);
				if(!user) user = {username: "Non-cached User", discriminator: "#0000", id: users[i]};
				var userstrikes = strikes.filter(x => x.user_id == users[i]);

				var tmp = await bot.utils.genEmbeds(bot, userstrikes, async s => {
					return {name: s.hid, value: s.reason}
				}, {
					title: `Strikes for ${user.username}#${user.discriminator} (${user.id})`,
					description: `Current strike count: ${userstrikes.length}`
				}, 10);

				embeds = embeds.concat(tmp);
			}

			if(embeds[1]) {
				for(let i=0; i<embeds.length; i++) {
					embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${strikes.length} strikes total)`;
				}
			}

			return embeds;
		}

		if(Number.isNaN(parseInt(args[0].replace(/[<@!>]/g,"")))) {
			var strike = await bot.stores.strikes.get(msg.guild.id, args[0].toLowerCase());
			if(!strike) return "Strike not found";

			var user = await bot.utils.fetchUser(bot, strike.user_id);
			if(!user) user = {
				username: "Non-cached User",
				discriminator: "#0000",
				id: strike.user_id
			};

			return {embed: {
				title: `Strike ${strike.hid}`,
				description: [
				`**User:**\n${user.username}#${user.discriminator} (${user.id})\n\n`,
				`**Reason:**\n${strike.reason}`
				].join(""),

			}};
		} else {
			var user = await bot.utils.fetchUser(bot, args[0].replace(/[<@!>]/g,""))
			if(!user) return "Couldn't find that user";
			
			var strikes = await bot.stores.strikes.getByUser(msg.guild.id, user.id);
			if(!strikes || !strikes[0]) return "That user has no strikes";

			var embeds = await bot.utils.genEmbeds(bot, strikes, async s => {
				return {name: s.hid, value: s.reason}
			}, {
				title: `Strikes for ${user.username}#${user.discriminator} (${user.id})`,
				description: `Current strike count: ${strikes.length}`
			}, 10);

			return embeds;
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
		if(!args[0]) return "Please provide a user to add a strike to";

		var user = msg.guild.members.find(m => m.id == args[0].replace(/[<@!>]/g, "") || (m.username + "#" + m.discriminator).toLowerCase() == args[0].toLowerCase());
		if(!user) return "Couldn't find that user";

		var strikes = await bot.stores.strikes.getByUser(msg.guild.id, user.id) || [];
		var code = bot.utils.genCode(4, bot.strings.codestab);

		var scc = await bot.stores.strikes.create(msg.guild.id, code, user.id, args[1] ? args.slice(1).join(" ") : "[no reason given]");
		if(scc) return `Strike added! New count: ${strikes.length + 1}\nStrike hid: ${code}`;
		else return "Something went wrong";
	},
	alias: ["give", "+"],
	permissions: ["manageMembers"],
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: ()=> "Remove a(ll) strike(s) from a user",
	usage: ()=> [" [user] [strikeID] - Remove the given strike from the given user",
				 " [user] all|* - Remove all strikes from the given user"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a user to remove the strike(s) from, and a strike/scope to remove";

		var user = msg.guild.members.find(m => m.id == args[0].replace(/[<@!>]/g, "") || (m.username + "#" + m.discriminator).toLowerCase() == args[0].toLowerCase());
		if(!user) return "Couldn't find that user";

		var strikes = await bot.stores.strikes.getByUser(msg.guild.id, user.id);
		if(!strikes || !strikes[0]) return "User has no strikes; nothing to remove";

		var scc;
		if(["all", "*"].includes(args[1].toLowerCase())) scc = await bot.stores.strikes.deleteByUser(msg.guild.id, user.id);
		else scc = await bot.stores.strikes.delete(msg.guild.id, args[1].toLowerCase());

		if(scc) return `Strike${["all", "*"].includes(args[1].toLowerCase()) ? "s" : ""} removed!`;
		else return "Something went wrong";

	},
	alias: ["take", "delete", "-"],
	permissions: ["manageMembers"],
	guildOnly: true
}