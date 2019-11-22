module.exports = {
	help: ()=> "Create and manage polls",
	usage: ()=> [" [pollID] - Get info on a particular poll",
				 " create [title] - Sets up a new poll in the given channel",
				 " list - Lists all polls started in the server (mods only)",
				 " active - Lists active polls (mods only)"],
	desc: ()=> ["Users need the `manageMessages` permission in order to list polls.",
				"A poll is only deleted from the database if its message (or the channel it's in) is deleted. If this doesn't happen, you'll be able to view all polls started in the server with `hh!poll list` and pull up old polls using `hh!poll [id]`"],
	execute: async (bot, msg, args) => {
		var poll = await bot.utils.getPollByHid(bot, msg.guild.id, args[0].toLowerCase());
		if(!poll) return msg.channel.createMessage("Poll not found");

		msg.channel.createMessage({embed: {
			title: poll.title,
			description: poll.description,
			color: poll.active ? parseInt("55aa55", 16) : parseInt("aa5555", 16),
			fields: poll.choices.map((c,i) => {
				return {name: `:${bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} votes`}
			}),
			footer: {
				text: `ID: ${poll.hid} | Started: ${bot.formatTime(new Date(poll.start))}${!poll.active ? " | Ended: "+bot.formatTime(new Date(poll.end)) : ""}`
			}
		}})
	},
	subcommands: {},
	alias: ["polls", "vote", "votes", "census"],
	guildOnly: true
}

module.exports.subcommands.create = {
	help: ()=> "Create a new poll",
	usage: ()=> [" [title] - Runs a menu to set up a poll with the given title/question"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a title for the poll");
		var title = args.join(" ");
		var desc;
		var choices;

		await msg.delete();

		var resp;
		var message;
		message = await msg.channel.createMessage("Please enter a description for your poll. If you don't need one, you can type `skip` to skip it. You have two (2) minutes to do this");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 120000});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
		else desc = resp[0].content;
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
				return {name: `:${bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} votes`}
			}),
			footer: {
				text: `ID: ${hid} | Started: ${bot.formatTime(date)}`
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
	alias: ["add", "new", "+"],
	guildOnly: true
}