.module.exports = {
	help: ()=> "Send feedback to a server.",
	usage: ()=> [' [serverID] - Initiate feedback menu',
				 ' channel [channel] - Set the channel for feedback to go to',
				 ' anon [1|0] - Set whether anon messages are allowed. Default: true',
				 ' config - View the current feedback config',
				 ' reply [id] [message] - Reply to feedback',
				 ' delete [id] - Delete a feedback message (use * to delete all)',
				 ' list - List all feedback posts',
				 ' view [id] - View an individual ticket',
				 ' find [query] - Search through tickets to find ones matching the given query'],
	desc: ()=> "A server's ID can be found by turning on developer mode and right clicking on a server (desktop) or opening a server's menu (mobile)",
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a server ID."
		var cfg = await bot.stores.feedbackConfigs.get(args[0]);
		var embed, anon;
		if(!cfg || !cfg.channel_id) return "That server is not currently accepting feedback.";

		await msg.channel.createMessage("Please enter your message below. You have 5 minutes to do this.");
		var messages = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60*5,maxMatches:1});
		if(messages[0]) embed = {title: "Feedback", description: messages[0].content};
		else return "Action cancelled: timed out.";
		if(cfg.anon) {
			await msg.channel.createMessage("Would you like this to be anonymous? (y/n)\nYou have 30 seconds to answer, otherwise it will not be anonymous");
			messages = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:30000,maxMatches:1});
			if(messages[0]) {
				anon = ["y","yes","true","1"].includes(messages[0].content.toLowerCase());
				embed.author = (anon ? {name: "Anonymous"} : {name: `${msg.author.username}#${msg.author.discriminator}`});
			}
			else {
				anon = false;
				embed.author = {name: `${msg.author.username}#${msg.author.discriminator}`}
			}
		} else {
			anon = false;
			embed.author = {name: `${msg.author.username}#${msg.author.discriminator}`}
		}
		var code = bot.utils.genCode(4, bot.strings.codestab);
		embed.timestamp = new Date();
		embed.footer = {text: `ID: ${code}`};
		await msg.channel.createMessage({content: "Is this okay? (y/n)",embed: embed});

		messages = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:30000,maxMatches:1});
		if(messages[0]) {
			if(["y","yes","true","1"].includes(messages[0].content.toLowerCase())) {
				bot.createMessage(cfg.channel_id, {embed: embed});
				bot.stores.feedbackTickets.create(code, args[0], msg.author.id, embed.description, anon);
				return `Sent!`
			} else return "Action cancelled.";
		} else return "Action cancelled: timed out.";
	},
	subcommands: {},
	alias: ['fb'],
	module: "utility"
}

module.exports.subcommands.channel = {
	help: ()=> "Sets the channel where feedback goes, enabling feedback.",
	usage: ()=> [" [channel] - Sets the channel",
				 " - Resets the channel (disabled feedback)"],
	execute: async (bot, msg, args) => {
		var cfg = (await bot.stores.feedbackConfigs.get(msg.guild.id));
		if(!cfg) cfg = {new: true};
		if(!args[0]) return "Please provide a channel."
		var channel =  msg.guild.channels.find(ch => ch.id == args[0].replace(/<#>/g, '') || ch.name == args[0].toLowerCase());
		if(!channel && args[0]) return "Channel not found.";

		if(channel) cfg.channel_id = channel.id;
		else delete cfg.channel_id;
		cfg.anon = cfg.anon != null ? cfg.anon : true;

		try {
			if(cfg.new) await bot.stores.feedbackConfigs.create(msg.guild.id, cfg)
			else await bot.stores.feedbackConfigs.update(msg.guild.id, cfg);
		} catch(e) {
			return "ERR: "+e;
		}

		return "Channel updated!";
	},
	guildOnly: true,
	permissions: ['manageGuild'],
	alias: ['ch', 'chan']
}

module.exports.subcommands.anon = {
	help: ()=> "Sets whether anon feedback is allowed or not.",
	usage: ()=> [" [1|0] - Sets the anon value"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.feedbackConfigs.get(msg.guild.id);
		if(!cfg) cfg = {new: true};
		if(!args[0]) return "Please provide a value."

		cfg.anon = args[0] == 1 ? true : false;

		try {
			if(cfg.new) await bot.stores.feedbackConfigs.create(msg.guild.id, cfg)
			else await bot.stores.feedbackConfigs.update(msg.guild.id, cfg);
		} catch(e) {
			return "ERR: "+e;
		}

		return "Anon setting updated!";
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.config = {
	help: ()=> "Views current config.",
	usage: ()=> [" - Views server's feedback config"],
	execute: async (bot, msg, args) => {
		var cfg = (await bot.stores.feedbackConfigs.get(msg.guild.id)) || {};
		var channel = cfg.channel ? msg.guild.channels.find(c => c.id == cfg.channel) : undefined;
		msg.channel.createMessage({embed: {
			title: "Feedback Config",
			fields: [
			{name: "Channel", value: channel ? channel.mention : "*(Not set)*"},
			{name: "Anon", value: cfg.anon ? "True" : "False"}
			]
		}})
	},
	alias: ['view'],
	guildOnly: true
}

module.exports.subcommands.reply = {
	help: ()=> "Reply to a ticket.",
	usage: ()=> [" [hid] [message] - Send a message to a ticket's creator"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a ticket and a message.";

		var ticket = await bot.stores.feedbackTickets.get(msg.guild.id, args[0].toLowerCase());
		if(!ticket) return 'Ticket not found.';

		var channel = await bot.getDMChannel(ticket.sender_id);
		if(!channel) return "Can't deliver message: unable to get user's DM channel.";

		try {
			channel.createMessage({embed: {
				title: "Feedback Reply",
				description: args.slice(1).join(" "),
				timestamp: new Date(),
				footer: {
					text: `ID: ${ticket.hid}`
				}
			}})
		} catch(e) {
			console.log(e);
			return 'Reply failed: '+e.message;
		}

		return 'Reply sent!';
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.delete = {
	help: ()=> "Delete one or all feedback ticket(s).",
	usage: ()=> [" [hid] - Deletes the given ticket",
				 " * - Deletes all registered tickets"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return 'Please provide a ticket to delete.';
		if(args[0] == "*") {
			try {
				await bot.stores.feedbackTickets.deleteAll(msg.guild.id);
			} catch(e) {
				return "ERR: "+e;
			}
			
			return 'Tickets deleted!';
		} else {
			var ticket = await bot.stores.feedbackTickets.get(msg.guild.id, args[0].toLowerCase());
			if(!ticket) return "Ticket not found.";

			try {
				await bot.stores.feedbackTickets.delete(msg.guild.id, ticket.hid);
			} catch(e) {
				return "ERR: "+e;
			}

			return 'Ticket deleted!';
		}
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.list = {
	help: ()=> "Lists all feedback tickets.",
	usage: ()=> [" - Lists all indexed tickets for the server"],
	execute: async (bot, msg, args) => {
		var tickets = await bot.stores.feedbackTickets.getAll(msg.guild.id);
		if(!tickets || !tickets[0]) return 'No tickets registered for this server.';

		for(var i = 0; i < tickets.length; i++) {
			var user = await bot.utils.fetchUser(bot, tickets[i].sender_id);
			if(user && !tickets[i].anon) tickets[i].user = `${user.username}#${user.discriminator}`;
			else if(tickets[i].anon) tickets[i].user = "Anonymous";
			else tickets[i].user = "*(User not cached)*"
		}

		var embeds = await bot.utils.genEmbeds(bot, tickets, async dat => {
			return {name: `User: ${dat.user} | Ticket: ${dat.hid}`, value: dat.message.length > 500 ? dat.message.slice(0, 500) + "..." : dat.message}
		}, {
			title: "Feedback",
			description: "Use `hh!feedback view [id]` to view a ticket individually",
		}, 10);

		return embeds;
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.view = {
	help: ()=> "Views an individual ticket,",
	usage: ()=> [" [id] - Views a ticket with the given ID"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a ticket ID."
		var ticket = await bot.stores.feedbackTickets.get(msg.guild.id, args[0]);
		if(!ticket) return "That ticket does not exist.";

		var user = await bot.utils.fetchUser(bot, ticket.sender_id);
		
		return {embed: {
			title: "Feedback",
			description: ticket.message,
			author: {
				name: ticket.anon ? "Anonymous" : `${user.username}#${user.discriminator}`
			}
		}}
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.find = {
	help: ()=> "Find tickets matching a specific query,",
	usage: ()=> [" [words to search] - Find tickets with certain words",
				 " from:[userID] - Find tickets from a certain user (does not list anonymous ones)",
				 " from:[userID] [words to search] - Find tickets from a certain user that also contain certain words (also does not list anonymous ones)"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a search query."
		var query;
		var user;
		var tickets;
		if(args[0].toLowerCase().startsWith('from:')) {
			user = args[0].toLowerCase().replace('from:','');
			query = args[1] ? args.slice(1).join(" ").toLowerCase() : undefined;
		} else {
			query = args[0] ? args.join(" ").toLowerCase() : undefined;
		}
		if(!user && !query) return "Please provide a search query";

		var tickets = await bot.stores.feedbackTickets.search(msg.guild.id, {sender_id: user, message: query});
		if(!tickets || !tickets[0]) return 'No tickets found matching that query.';

		for(var i = 0; i < tickets.length; i++) {
			var user = await bot.utils.fetchUser(bot, tickets[i].sender_id);
			if(user && !tickets[i].anon) tickets[i].user = `${user.username}#${user.discriminator}`;
			else if(tickets[i].anon) tickets[i].user = "Anonymous";
			else tickets[i].user = "*(User not cached)*"
		}

		var embeds = await bot.utils.genEmbeds(bot, tickets, async dat => {
			return {name: `User: ${dat.user} | Ticket: ${dat.hid}`, value: dat.message.length > 500 ? dat.message.slice(0, 500) + "..." : dat.message}
		}, {
			title: "Search Results",
			description: "Use `hh!feedback view [id]` to view a ticket individually",
		}, 10);

		return embeds;
	},
	alias: ['search'],
	guildOnly: true,
	permissions: ['manageGuild']
}