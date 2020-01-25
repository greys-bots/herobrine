module.exports = {
	help: ()=> "Create and manage polls",
	usage: ()=> [" - Lists polls started in the server (mod only)",
				 " active - Lists active polls (mod only)",
				 " [pollID] - Get info on a particular poll",
				 " create <title> - Sets up a new poll in the channel the command is used in",
				 " find [query] - Finds polls that match a specific query (mod only)"],
	desc: ()=> ["Users need the `manageMessages` permission in order to list polls.\n",
				"A poll is only deleted from the database if its message ",
				"(or the channel it's in) is deleted. If this doesn't happen, ",
				"you'll be able to view all polls started in the server with ",
				"`hh!poll list` and pull up old polls using `hh!poll [id]`"].join(""),
	execute: async (bot, msg, args) => {
		if(args[0] && args[0].toLowerCase() != "active") {
			var poll = await bot.utils.getPollByHid(bot, msg.guild.id, args[0].toLowerCase());
			if(!poll) return msg.channel.createMessage("Poll not found");
			var member = msg.guild.members.find(m => m.id == poll.user_id);
			if(!member) member = {username: "Uncached Member", discriminator: "0000", avatarURL: null};

			return msg.channel.createMessage({embed: {
				title: poll.title,
				description: poll.description,
				color: poll.active ? parseInt("55aa55", 16) : parseInt("aa5555", 16),
				fields: poll.choices.map((c,i) => {
					return {name: `:${i+1 == 10 ? "keycap_10" : bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} ${c.count != 1 ? "votes" : "vote"}`}
				}),
				footer: {
					text: `ID: ${poll.hid} | Started: ${bot.formatTime(new Date(poll.start))}${!poll.active ? " | Ended: "+bot.formatTime(new Date(poll.end)) : ""}`
				},
				author: {
					name: `${member.username}#${member.discriminator}`,
					icon_url: `${member.avatarURL}`
				}
			}})
		}
		
		var polls = await bot.utils.getPolls(bot, msg.guild.id);
		if(args[0] && args[0].toLowerCase() == "active") polls = polls.filter(p => p.active);

		var embeds = polls.map((p,i) => {
			return {embed: {
				title: `${p.title} (poll ${i+1}/${polls.length})`,
				description: p.description,
				color: p.active ? parseInt("55aa55", 16) : parseInt("aa5555", 16),
				fields: p.choices.map((c,i) => {
					return {name: `:${bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} votes`}
				}),
				footer: {
					text: `ID: ${p.hid} | Started: ${bot.formatTime(new Date(p.start))}${!p.active ? " | Ended: "+bot.formatTime(new Date(p.end)) : ""}`
				}
			}}
		})

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
		
	},
	subcommands: {},
	alias: ["polls", "vote", "votes", "census"],
	guildOnly: true,
	module: "utility"
}

module.exports.subcommands.create = {
	help: ()=> "Create a new poll",
	usage: ()=> [" <title> - Runs a menu to set up a poll with the given title/question, otherwise asks for a title"],
	execute: async (bot, msg, args) => {
		var title;
		var resp;
		var message;
		var desc;
		var choices;

		try {
			await msg.delete();
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("ERR: can't delete messages. Make sure I have the `manageMessages` permission and then try again");
		}

		if(args[0]) title = args.join(" ");
		else {
			message = await msg.channel.createMessage("Please enter a title for your poll. You have two minutes to do this");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 120000});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
			else title = resp[0].content;
		}
		await resp[0].delete();

		if(!message) message = await msg.channel.createMessage("Please enter a description for your poll. If you don't need one, you can type `skip` to skip it. You have two (2) minutes to do this");
		else await message.edit("Please enter a description for your poll. If you don't need one, you can type `skip` to skip it. You have two (2) minutes to do this");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 120000});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
		else {
			if(resp[0].content.toLowerCase() == "skip") desc = "*(no description provided)*"
			else desc = resp[0].content;
		}
		await resp[0].delete()

		await message.edit("Please provide the options for your poll. These should be separated by new lines, and you can do a max of 10. You have five (5) minutes to do this");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 300000});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
		else choices = resp[0].content.split("\n").map(c => {
			return {option: c, count: 0}
		});
		await resp[0].delete();

		var date = new Date();
		var hid = bot.utils.genCode(4, bot.strings.codestab);

		var poll = await message.channel.createMessage({embed: {
			title: title,
			description: desc,
			color: parseInt("55aa55", 16),
			fields: choices.map((c, i) => {
				return {name: `:${i+1 == 10 ? "keycap_10" : bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} votes`}
			}),
			footer: {
				text: `ID: ${hid} | Started: ${bot.formatTime(date)}`
			},
			author: {
				name: `${msg.author.username}#${msg.author.discriminator}`,
				icon_url: `${msg.author.avatarURL}`
			},
			timestamp: date.toISOString()
		}});

		choices.forEach((c,i) => poll.addReaction(`${bot.strings.pollnumbers[i+1]}`));
		["✅","✏","❓"].forEach(r => poll.addReaction(r));
		await message.delete();

		var scc = await bot.utils.addPoll(bot, hid, poll.channel.guild.id, poll.channel.id, poll.id,
										  msg.author.id, title, desc, choices, date.toISOString())
		if(!scc) var errmsg = msg.channel.createMessage("The poll has been created, but" +
														" couldn't be inserted into the database." +
														" Users can still react to the message, but" +
														" it will not show up when listing or auto-update");
		if(errmsg) setTimeout(()=> errmsg.delete(), 15000);

	},
	alias: ["add", "new", "+", "n", "c"],
	guildOnly: true
}

module.exports.subcommands.find = {
	help: ()=> "Find polls that match a specific query",
	usage: ()=> [" [words to search] - Find polls with certain words",
				 " from:[userID] - Find polls from a certain user",
				 " from:[userID] [words to search] - Find polls from a certain user that also contain certain words"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a search query.")
		var query;
		var user;
		var polls;
		if(args[0].toLowerCase().startsWith('from:')) {
			user = args[0].toLowerCase().replace('from:','');
			query = args[1] ? args.slice(1).join(" ").toLowerCase() : undefined;
		} else {
			query = args[0] ? args.join(" ").toLowerCase() : undefined;
		}
		if(!user && !query) return msg.channel.createMessage("Please provide a search query");

		polls = await bot.utils.searchPolls(bot, msg.guild.id, user, query);

		if(!polls) return msg.channel.createMessage("No polls found that match that query");

		var embeds = polls.map((p,i) => {
			return {embed: {
				title: `${p.title} (poll ${i+1}/${polls.length})`,
				description: p.description,
				color: p.active ? parseInt("55aa55", 16) : parseInt("aa5555", 16),
				fields: p.choices.map((c,i) => {
					return {name: `:${bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} votes`}
				}),
				footer: {
					text: `ID: ${p.hid} | Started: ${bot.formatTime(new Date(p.start))}${!p.active ? " | Ended: "+bot.formatTime(new Date(p.end)) : ""}`
				}
			}}
		})

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
		}
		message.addReaction("\u2b05");
		message.addReaction("\u27a1");
		message.addReaction("\u23f9");
	},
	alias: ["search", "f"],
	guildOnly: true,
	permissions: ["manageMessages"]
}