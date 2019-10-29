module.exports = {
	help: ()=> "Send feedback to a server",
	usage: ()=> [' [serverID] - Initiate feedback menu',
				 'channel [channel] - Set the channel for feedback to go to',
				 'anon [1|0] - Set whether anon messages are allowed. Default: true',
				 'config - View the current feedback config',
				 'reply [id] [message] - Reply to feedback',
				 'delete [id] - Delete a feedback message (use * to delete all)',
				 'list - List all feedback posts',
				 'view [id] - View an individual ticket',
				 'find [query] - Search through tickets to find ones matching the given query'],
	desc: ()=> "A server's ID can be found by turning on developer mode and right clicking on a server (desktop) or opening a server's menu (mobile)",
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a server ID.")
		var cfg = await bot.utils.getConfig(bot, args[0]);
		var embed, anon;
		if(!cfg || !cfg.feedback || !cfg.feedback.channel) return msg.channel.createMessage("That server is not currently accepting feedback");
		await msg.channel.createMessage("Please enter your message below. You have 5 minutes to do this.");
		var messages = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:1000*60*5,maxMatches:1});
		if(messages[0]) embed = {title: "Feedback", description: messages[0].content};
		else return msg.channel.createMessage("Action cancelled: timed out");
		if(cfg.feedback.anon) {
			console.log(cfg.feedback.anon);
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
				bot.createMessage(cfg.feedback.channel, {embed: embed});
				bot.utils.addTicket(bot, code, args[0], msg.author.id, embed.description, anon);
				msg.channel.createMessage(`Sent!`)
			} else return msg.channel.createMessage("Action cancelled");
		} else return msg.channel.createMessage("Action cancelled: timed out");
	},
	subcommands: {},
	alias: ['fb']
}

module.exports.subcommands.channel = {
	help: ()=> "Sets the channel where feedback goes, enabling feedback",
	usage: ()=> [" [channel] - Sets the channel",
				 " - Resets the channel (disabled feedback"],
	execute: async (bot, msg, args, cfg = {feedback: {anon: true}}) => {
		if(!cfg.feedback) cfg.feedback = {};
		if(!args[0]) return msg.channel.createMessage("Please provide a channel.")
		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[0]);
		if(!channel && args[0]) return msg.channel.createMessage('Channel not found');

		if(channel) cfg.feedback.channel = channel.id;
		else delete cfg.feedback.channel;
		cfg.feedback.anon = cfg.feedback.anon != null ? cfg.feedback.anon : true;

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, "feedback", cfg.feedback);
		if(scc) msg.channel.createMessage("Channel updated!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	permissions: ['manageGuild'],
	alias: ['ch', 'chan']
}

module.exports.subcommands.anon = {
	help: ()=> "Sets whether anon feedback is allowed or not",
	usage: ()=> [" [1|0] - Sets the anon value"],
	execute: async (bot, msg, args, cfg = {feedback: {anon: true}}) => {
		if(!cfg.feedback) cfg.feedback = {};
		if(!args[0]) return msg.channel.createMessage("Please provide a value.")

		cfg.feedback.anon = args[0] == 1 ? true : false;

		var scc = await bot.utils.updateConfig(bot, msg.guild.id, "feedback", cfg.feedback);
		if(scc) msg.channel.createMessage("Anon setting updated!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.config = {
	help: ()=> "Views current config",
	usage: ()=> [" - Views server's feedback config"],
	execute: async (bot, msg, args, cfg = {feedback: {}}) => {
		console.log(cfg)
		var channel = cfg.feedback.channel ? msg.guild.channels.find(c => c.id == cfg.feedback.channel) : undefined;
		msg.channel.createMessage({embed: {
			title: "Feedback Config",
			fields: [
			{name: "Channel", value: channel ? channel.mention : "*(Not set)*"},
			{name: "Anon", value: cfg.feedback.anon ? "True" : "False"}
			]
		}})
	},
	guildOnly: true
}

module.exports.subcommands.reply = {
	help: ()=> "Reply to a ticket",
	usage: ()=> [" [hid] [message] - Send a message to a ticket's creator"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a ticket and a message");

		var ticket = await bot.utils.getTicket(bot, msg.guild.id, args[0]);
		if(!ticket) return msg.channel.createMessage('Ticket not found');

		var channel = await bot.getDMChannel(ticket.sender_id);
		if(!channel) return msg.channel.createMessage("Can't deliver message: unable to get user's DM channel");

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
			return msg.channel.createMessage('Reply failed: '+e.message);
		}

		msg.channel.createMessage('Reply sent!');
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.delete = {
	help: ()=> "Delete one or all feedback ticket(s)",
	usage: ()=> [" [hid] - Deletes the given ticket",
				 " * - Deletes all registered tickets"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage('Please provide a ticket to delete');
		if(args[0] == "*") {
			var scc = await bot.utils.deleteTickets(bot, msg.guild.id);
			if(scc) msg.channel.createMessage('Tickets deleted!');
			else msg.channel.createMessage('Something went wrong')
		} else {
			var scc = await bot.utils.deleteTicket(bot, msg.guild.id, args[0]);
			if(scc) msg.channel.createMessage('Ticket deleted!');
			else msg.channel.createMessage('Something went wrong')
		}
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.list = {
	help: ()=> "Lists all feedback tickets",
	usage: ()=> [" - Lists all indexed tickets for the server"],
	execute: async (bot, msg, args) => {
		var tickets = await bot.utils.getTickets(bot, msg.guild.id);
		if(!tickets || !tickets[0]) return msg.channel.createMessage('No tickets registered for this server');

		await Promise.all(tickets.map(async t => {
			var user = await bot.utils.fetchUser(bot, t.sender_id);
			if(user && !t.anon) t.user = `${user.username}#${user.discriminator}`;
			else if(t.anon) t.user = "Anonymous";
			else t.user = "*(User not cached)*"
		}));

		if(tickets.length > 10) {
			var embeds = await bot.utils.genEmbeds(bot, tickets, async dat => {
				return {name: `User: ${dat.user} | Ticket: ${dat.hid}`, value: dat.message.length > 500 ? dat.message.slice(0, 500) + "..." : dat.message}
			}, {
				title: "Feedback",
				description: "Use `hh!feedback view [id]` to view a ticket individually",
			}, 10);

			msg.channel.createMessage(embeds[0]).then(message => {
				if(!bot.pages) bot.pages = {};
				bot.pages[message.id] = {
					user: msg.author.id,
					index: 0,
					data: embeds
				};
				message.addReaction("\u2b05");
				message.addReaction("\u27a1");
				message.addReaction("\u23f9");
				setTimeout(()=> {
					if(!bot.pages[message.id]) return;
					message.removeReaction("\u2b05");
					message.removeReaction("\u27a1");
					message.removeReaction("\u23f9");
					delete bot.pages[msg.author.id];
				}, 900000)
			})
		} else {
			msg.channel.createMessage({embed: {
				title: "Feedback",
				description: "Use `hh!feedback view [id]` to view a ticket individually",
				fields: tickets.map(t => {
					return {name: `User: ${t.user} | Ticket: ${t.hid}`, value: t.message.length > 500 ? t.message.slice(0, 500) + "..." : t.message}
				})
			}})
		}
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.view = {
	help: ()=> "Views an individual ticket",
	usage: ()=> [" [id] - Views a ticket with the given ID"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a ticket ID.")
		var ticket = await bot.utils.getTicket(bot, msg.guild.id, args[0]);
		if(!ticket) return msg.channel.createMessage("That ticket does not exist");

		var user = await bot.utils.fetchUser(bot, ticket.sender_id);
		
		msg.channel.createMessage({embed: {
			title: "Feedback",
			description: ticket.message,
			author: {
				name: ticket.anon ? "Anonymous" : `${user.username}#${user.discriminator}`
			}
		}})
	},
	guildOnly: true,
	permissions: ['manageGuild']
}

module.exports.subcommands.find = {
	help: ()=> "Find tickets matching a specific query",
	usage: ()=> [" [words to search] - Find tickets with certain words",
				 " from:[userID] - Find tickets from a certain user (does not list anonymous ones)",
				 " from:[userID] [words to search] - Find tickets from a certain user that also contain certain words (also does not list anonymous ones)"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a search query.")
		var query;
		var user;
		var tickets;
		if(args[0].toLowerCase().startsWith('from:')) {
			user = args[0].toLowerCase().replace('from:','');
			query = args[1] ? args.slice(1).join(" ").toLowerCase() : undefined;
		} else {
			query = args[0] ? args.join(" ").toLowerCase() : undefined;
		}
		if(!user && !query) return msg.channel.createMessage("Please provide a search query");

		if(user && !query) tickets = await bot.utils.getTicketsFromUser(bot, msg.guild.id, user);
		if(user && query) tickets = await bot.utils.searchTicketsFromUser(bot, msg.guild.id, user, query);
		if(!user && query) tickets = await bot.utils.searchTickets(bot, msg.guild.id, query);

		if(!tickets || !tickets[0]) return msg.channel.createMessage('No tickets found matching that query');

		await Promise.all(tickets.map(async t => {
			var user = await bot.utils.fetchUser(bot, t.sender_id);
			console.log(t.anon);
			if(user && !t.anon) t.user = `${user.username}#${user.discriminator}`;
			else if(t.anon) t.user = "Anonymous";
			else t.user = "*(User not cached)*"
		}));

		if(tickets.length > 10) {
			var embeds = await bot.utils.genEmbeds(bot, tickets, async dat => {
				return {name: `User: ${dat.user} | Ticket: ${dat.hid}`, value: dat.message.length > 500 ? dat.message.slice(0, 500) + "..." : dat.message}
			}, {
				title: "Search Results",
				description: "Use `hh!feedback view [id]` to view a ticket individually",
			}, 10);

			msg.channel.createMessage(embeds[0]).then(message => {
				if(!bot.pages) bot.pages = {};
				bot.pages[message.id] = {
					user: msg.author.id,
					index: 0,
					data: embeds
				};
				message.addReaction("\u2b05");
				message.addReaction("\u27a1");
				message.addReaction("\u23f9");
				setTimeout(()=> {
					if(!bot.pages[message.id]) return;
					message.removeReaction("\u2b05");
					message.removeReaction("\u27a1");
					message.removeReaction("\u23f9");
					delete bot.pages[msg.author.id];
				}, 900000)
			})
		} else {
			msg.channel.createMessage({embed: {
				title: "Search Results",
				description: "Use `hh!feedback view [id]` to view a ticket individually",
				fields: tickets.map(t => {
					return {name: `User: ${t.user} | Ticket: ${t.hid}`, value: t.message.length > 500 ? t.message.slice(0, 500) + "..." : t.message}
				})
			}})
		}
	},
	alias: ['search'],
	guildOnly: true,
	permissions: ['manageGuild']
}