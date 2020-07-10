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
			var poll = await bot.stores.polls.get(msg.guild.id, args[0].toLowerCase());
			if(!poll) return "Poll not found";
			var member = msg.guild.members.find(m => m.id == poll.user_id);
			if(!member) member = {username: "Uncached Member", discriminator: "0000", avatarURL: null};

			return {embed: {
				title: poll.title,
				description: poll.description,
				color: poll.active ? parseInt("55aa55", 16) : parseInt("aa5555", 16),
				fields: poll.choices.map((c,i) => {
					return {name: `:${i+1 == 10 ? "keycap_10" : bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} ${c.count != 1 ? "votes" : "vote"}`}
				}),
				footer: {
					text: `ID: ${poll.hid} | Started: ${bot.formatTime(new Date(poll.start_time))}${!poll.active ? " | Ended: "+bot.formatTime(new Date(poll.end_time)) : ""}`
				},
				author: {
					name: `${member.username}#${member.discriminator}`,
					icon_url: `${member.avatarURL}`
				}
			}}
		}
		
		var polls = await bot.stores.polls.getAll(msg.guild.id);
		if(!polls || !polls[0]) return "No polls are registered for this server.";
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
					text: `ID: ${p.hid} | Started: ${bot.formatTime(new Date(p.start_time))}${!p.active ? " | Ended: "+bot.formatTime(new Date(p.end_time)) : ""}`
				}
			}}
		})

		return embeds;	
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
			return "ERR: can't delete messages. Make sure I have the `manageMessages` permission and then try again";
		}

		if(args[0]) title = args.join(" ");
		else {
			message = await msg.channel.createMessage("Please enter a title for your poll. You have two minutes to do this");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 120000});
			if(!resp || !resp[0]) return "ERR: timed out. Aborting.";
			else title = resp[0].content;
			await resp[0].delete();
		}

		if(!message) message = await msg.channel.createMessage("Please enter a description for your poll. If you don't need one, you can type `skip` to skip it. You have two (2) minutes to do this");
		else await message.edit("Please enter a description for your poll. If you don't need one, you can type `skip` to skip it. You have two (2) minutes to do this");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 120000});
		if(!resp || !resp[0]) return "ERR: timed out. Aborting";
		else {
			if(resp[0].content.toLowerCase() == "skip") desc = "*(no description provided)*"
			else desc = resp[0].content;
		}
		await resp[0].delete()

		await message.edit("Please provide the options for your poll. These should be separated by new lines, and you can do a max of 10. You have five (5) minutes to do this");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 300000});
		if(!resp || !resp[0]) return "ERR: timed out. Aborting";
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

		try {
			await bot.stores.polls.create(poll.channel.guild.id, hid, {
				channel_id: poll.channel.id,
				message_id: poll.id,
				user_id: msg.author.id,
				title,
				description: desc,
				choices: JSON.stringify(choices),
				start: date.toISOString()
			});
		} catch(e) {
			var errmsg = await msg.channel.createMessage(
				"The poll has been created, but" +
				" couldn't be inserted into the database." +
				" Users can still react to the message, but" +
				" it will not show up when listing or auto-update"
			);
			setTimeout(()=> errmsg.delete(), 15000);
		}
		return;
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
		if(!args[0]) return "Please provide a search query."
		var query;
		var user;
		var polls;
		var user_match = args.join(" ").toLowerCase().match(/from\:\s?([0-9]*)/);
		if(user_match) {
			user = user_match[1];
			query = args.join(" ").toLowerCase().replace(new RegExp(user_match[0]), "").trim();
		} else {
			query = args[0] ? args.join(" ").toLowerCase() : undefined;
		}
		if(!user && !query) return "Please provide a search query.";

		polls = await bot.stores.polls.search(msg.guild.id, {user_id: user, message: query});

		if(!polls) return "No polls found that match that query.";

		var embeds = polls.map((p,i) => {
			return {embed: {
				title: `${p.title} (poll ${i+1}/${polls.length})`,
				description: p.description,
				color: p.active ? parseInt("55aa55", 16) : parseInt("aa5555", 16),
				fields: p.choices.map((c,i) => {
					return {name: `:${bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} votes`}
				}),
				footer: {
					text: `ID: ${p.hid} | Started: ${bot.formatTime(new Date(p.start_time))}${!p.active ? " | Ended: "+bot.formatTime(new Date(p.end_time)) : ""}`
				}
			}}
		})

		return embeds;
	},
	alias: ["search", "f"],
	guildOnly: true,
	permissions: ["manageMessages"]
}