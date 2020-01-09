const trigger_categories = [
	{
		name: "extreme",
		description: [
			"These are triggers that you absolutely can't be around. Examples include ",
			"things that cause harsh flashbacks, panic, or s||uicidal|| ideation"
		].join(""),
		color: "aa5555"
	},
	{
		name: "bad",
		description: [
			"These are triggers that are like the above, but to a smaller degree. They may only ",
			"make you dissociate or switch rather than full-on need to escape the situation"
		].join(""),
		color: "ff7755"
	},
	{
		name: "mild",
		description: [
			"These ones still affect you, but may be easier to handle in smaller amounts. ",
			"They're still triggers, but you're able to see them with ",
			"little to no warning without having an extremely adverse reaction"
		].join(""),
		color: "ccaa55"
	},
	{
		name: "squicks",
		description: [
			"These things aren't triggers at all, but rather are things that ",
			"make you uncomfortable or angry. For example, someone with misophonia ",
			"might have hearing people smack their lips as a squick, because it'd cause ",
			"anger/discomfort/so on"
		].join(""),
		color: "5555aa"
	}
];

module.exports= {
	help: ()=> "View and manage trigger lists",
	usage: ()=> [" - List your trigger lists, if you have any",
				 " [hid] - List triggers registered at that hid",
				 " new - Creates a new list, using a handy menu",
				 " add [hid] <category> <trigger to add> - Adds a trigger to a list. If no trigger is given, runs a menu",
				 " remove [hid] <category> <trigger to remove> - Removes a trigger from a list. If no trigger is given, runs a menu",
				 " delete [hid] - Deletes a trig+ger list"],
	desc: ()=> ["**Categories**\n",
				`Trigger lists are split into ${trigger_categories.length} categories:`,
				`${tigger_categories.map(c => "`"+c.name+"`")}\n`,
				trigger.categories.map(c => `${c.name.toUpperCase()} - ${c.description}`).join("\n")],
	execute: async (bot, msg, args) => {
		if(args[0]) {
			var triggers = await bot.utils.getTriggerList(bot, msg.author.id, args[0].toLowerCase());
			if(!triggers) return msg.channel.createMessage("That trigger list does not exist");
			if(triggers == "private") return msg.channel.createMessage("You do not have permission to view that list");
			if(!Object.keys(triggers.list).find(k => triggers.list[k][0])) return msg.channel.createMessage("That list has no triggers reigstered on it");

			var embeds = Object.keys(triggers.list).map(s => {
				if(!triggers.list[s][0]) return null
				return {embed: {
					title: `${triggers.name} (${s.toUpperCase()})`,
					description: triggers.list[s].join("\n"),
					color: parseInt(trigger_categories.find(c => c.name == s).color, 16),
					footer: {
						text: `ID: ${triggers.hid} | This list ${triggers.private ? "is" : "is not"} private`
					}
				}}
			}).filter(x => x !== null);

			var message = await msg.channel.createMessage(embeds[0]);
			if(triggers.user_id == msg.author.id || embeds[1]) {
				if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
					user: msg.author.id,
					index: 0,
					data: {embeds: embeds, list: triggers, msg: msg},
					timeout: setTimeout(()=> {
						if(!bot.menus[message.id]) return;
						message.removeReactions();
						delete bot.menus[message.id];
					}, 900000),
					execute: bot.utils.handleTriggerReactions
				};
				if(embeds[1]) ["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
				if(msg.author.id == triggers.user_id) ["\u270f","❌"].forEach(r => message.addReaction(r));
			}
			return;
		}
		
		var lists = await bot.utils.getTriggerLists(bot, msg.author.id);
		if(!lists || !lists[0]) return msg.channel.createMessage("You don't have any trigger lists registered");

		var embeds = await bot.utils.genEmbeds(bot, lists, l => {
			return {name: l.name, value: l.hid}
		}, {
			title: "Registered Trigger Lists",
			color: parseInt("5555aa", 16)
		})

		var message = await msg.channel.createMessage(embeds[0]);
		if(embeds[1]) {
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				data: {embeds: embeds, list: triggers},
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					message.removeReactions()
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
		}
	},
	subcommands: {},
	alias: ["trigs"]
}

module.exports.subcommands.new = {
	help: ()=> "Creates a new trigger list.",
	usage: ()=> [" - Opens a menu for creating a new list"],
	execute: async (bot, msg, args)=>{
		var resp;
		var name;
		var list = {extreme: [], bad: [], mild: []};
		var private;
		var attempt = 0;

		await msg.channel.createMessage("Enter a name for the list. You have 1 minute to do this.\nThe name must be between 1 and 100 characters. Type `cancel` to cancel");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
		if(resp[0].content.length > 100) return msg.channel.createMessage("ERR: name must be between 1 and 100 chars in length. Aborting");
		if(resp[0].content.toLowerCase() == "cancel") return msg.channel.createMessage("Action cancelled");
		name = resp[0].content;

		while(attempt < 2) {
			for(category of trigger_categories) {
				await msg.channel.createMessage([
					`Enter things for the ${category.name.toUpperCase()} category, separated by new lines (shift + enter). `,
					category.description+"\n",
					"You have 5 minutes to do this. Type `cancel` to cancel, or `skip` to skip this part"
				].join(""));
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 5*60000, maxMatches: 1});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
				if(resp[0].content.toLowerCase() == "cancel") return msg.channel.createMessage("Action cancelled");
				if(resp[0].content.toLowerCase() != "skip") list[category.name] = resp[0].content.split("\n");
			}

			if(!Object.keys(list).find(x => list[x][0]) && attempt < 1) {
				await msg.channel.createMessage("ERR: no triggers or squicks have been added. Would you like to cancel adding a list? (y/n)");
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 5*60000, maxMatches: 1});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
				if(["y", "yes"].includes(resp[0].content.toLowerCase())) return msg.channel.createMessage("Action cancelled");
				else {
					msg.channel.createMessage("Restarting trigger adding...");
					attempt = 1
				}
			} else if(!Object.keys(list).find(x => list[x][0]) && attempt > 1) return msg.channel.createMessage("ERR: no triggers added. Aborting");
			else attempt = 2;
		}

		await msg.channel.createMessage("Would you like this list to be private? (y/n)");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 5*60000, maxMatches: 1});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
		if(["yes", "y"].includes(resp[0].content.toLowerCase())) private = true;
		else private = false;

		var hid = bot.utils.genCode(4, bot.strings.codestab);
		var scc = await bot.utils.addTriggerList(bot, msg.author.id, hid, name, list, private);
		if(scc) msg.channel.createMessage(`List created! ID: ${hid}`);
		else msg.channel.createMessage("Something went wrong");
	}
}

module.exports.subcommands.rename = {
	help: ()=> "Rename a trigger list",
	usage: ()=> [" [hid] [new name] - Sets the name of the list"],
	desc: ()=> "Note that the name can only be between 1 and 100 characters",
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a list and the new name");

		var list = await bot.utils.getTriggerList(bot, msg.author.id, args[0].toLowerCase());
		if(!list) return msg.channel.createMessage("List not found");
		if(list == "private" || list.user_id != msg.author.id) return msg.channel.createMessage("You do not have permission to edit that list");
		args.shift();
		if(args.join(" ").length > 100) return msg.channel.createMessage("That name is too long. Names must be between 1 and 100 characters in length");

		var scc = await bot.utils.updateTriggerList(bot, msg.author.id, list.hid, {name: args.join(" ")});
		if(scc) msg.channel.createMessage("List updated!");
		else msg.channel.createMessage("Something went wrong");
	}
}

module.exports.subcommands.set = {
	help: ()=> "Set triggers on a list",
	usage: ()=> [" [hid] <category> <triggers to set> - Sets triggers on a list, replacing existing ones. Uses a menu if triggers aren't specified"],
	desc: ()=> "Triggers should be separated by new lines",
	execute: async (bot, msg, args)=>{
		if(!args[0]) return msg.channel.createMessage("Please provide a list to set");
		var list = await bot.utils.getTriggerList(bot, msg.author.id, args[0].toLowerCase());
		if(!list) return msg.channel.createMessage("List not found");
		if(list == "private" || list.user_id != msg.author.id) return msg.channel.createMessage("You do not have permission to edit that list");
		args.shift();

		var category;
		var trigs;
		var resp;

		if(args[0]) category = args.shift().toLowerCase();
		else {
			await msg.channel.createMessage("What category do you want to set triggers on? Available categories: `extreme`, `bad`, `mild`, `squicks`, `all`");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
			category = resp[0].content.toLowerCase();
		}

		if(!["extreme", "bad", "mild", "squick", "squicks", "all"].includes(category.toLowerCase())) 
			return msg.channel.createMessage("ERR: invalid category given. Aborting");

		if(category == "all") {
			var attempt = 0;
			while(attempt < 2) {
				for(category of trigger_categories) {
					await msg.channel.createMessage([
						`Enter things for the ${category.name.toUpperCase()} category, separated by new lines (shift + enter). `,
						category.description+"\n",
						"You have 5 minutes to do this. Type `cancel` to cancel, or `skip` to skip this part"
					].join(""));
					resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 5*60000, maxMatches: 1});
					if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
					if(resp[0].content.toLowerCase() == "cancel") return msg.channel.createMessage("Action cancelled");
					if(resp[0].content.toLowerCase() != "skip") list.list[category.name] = resp[0].content.split("\n");
				}

				if(!Object.keys(list).find(x => list[x][0]) && attempt < 1) {
					await msg.channel.createMessage("ERR: no triggers or squicks exist on this list. Would you like to cancel setting triggers? (y/n)");
					resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 5*60000, maxMatches: 1});
					if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
					if(["y", "yes"].includes(resp[0].content.toLowerCase())) return msg.channel.createMessage("Action cancelled");
					else {
						msg.channel.createMessage("Restarting trigger adding...");
						attempt = 1
					}
				} else if(!Object.keys(list).find(x => list[x][0]) && attempt > 1) return msg.channel.createMessage("ERR: no triggers given. Aborting");
				else attempt = 2;
			}
		} else {
			if(args[0]) trigs = args[0].split("\n");
			else {
				await msg.channel.createMessage("Enter the triggers you'd like to set, separated by new lines. You have 5 minutes to do this");
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 5*60000, maxMatches: 1});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
				trigs = resp[0].content.split("\n");
			}
			
			list.list[category] = list.list[category].concat(trigs);
		}
		
		var scc = await bot.utils.updateTriggerList(bot, msg.author.id, list.hid, {list: list.list});
		if(scc) msg.channel.createMessage("List updated!");
		else msg.channel.createMessage("Something went wrong");
	}
}

module.exports.subcommands.add = {
	help: ()=> "Add new triggers to a list",
	usage: ()=> [" [hid] <category> <triggers to add> - Adds triggers to a list. Uses a menu if triggers aren't specified"],
	desc: ()=> "Triggers should be separated by new lines",
	execute: async (bot, msg, args)=>{
		if(!args[0]) return msg.channel.createMessage("Please provide a list to add to");
		var list = await bot.utils.getTriggerList(bot, msg.author.id, args[0].toLowerCase());
		if(!list) return msg.channel.createMessage("List not found");
		if(list == "private" || list.user_id != msg.author.id) return msg.channel.createMessage("You do not have permission to edit that list");
		args.shift();

		var category;
		var trigs;
		var resp;

		if(args[0]) category = args.shift().toLowerCase();
		else {
			await msg.channel.createMessage("What category do you want to add triggers to? Available categories: `extreme`, `bad`, `mild`, `squicks`");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
			category = resp[0].content.toLowerCase();
		}

		if(!["extreme", "bad", "mild", "squick", "squicks"].includes(category.toLowerCase())) 
			return msg.channel.createMessage("ERR: invalid category given. Aborting");

		if(args[0]) trigs = args[0].split("\n");
		else {
			await msg.channel.createMessage("Enter the triggers you'd like to add, separated by new lines. You have 5 minutes to do this");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 5*60000, maxMatches: 1});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
			trigs = resp[0].content.split("\n");
		}
		
		list.list[category] = list.list[category].concat(trigs);
		var scc = await bot.utils.updateTriggerList(bot, msg.author.id, list.hid, {list: list.list});
		if(scc) msg.channel.createMessage("List updated!");
		else msg.channel.createMessage("Something went wrong");
	}
}

module.exports.subcommands.remove = {
	help: ()=> "Remove triggers from a list",
	usage: ()=> [" [hid] <category> <triggers to remove> - Removes triggers from a list. Uses a menu if triggers aren't specified"],
	desc: ()=> "Triggers should be separated by new lines",
	execute: async (bot, msg, args)=>{
		if(!args[0]) return msg.channel.createMessage("Please provide a list to remove from");
		var list = await bot.utils.getTriggerList(bot, msg.author.id, args[0].toLowerCase());
		if(!list) return msg.channel.createMessage("List not found");
		if(list == "private" || list.user_id != msg.author.id) return msg.channel.createMessage("You do not have permission to edit that list");
		args.shift();

		var category;
		var trigs;
		var resp;

		if(args[0]) category = args.shift().toLowerCase();
		else {
			await msg.channel.createMessage("What category do you want to remove triggers from? Available categories: `extreme`, `bad`, `mild`, `squicks`");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 60000, maxMatches: 1});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
			category = resp[0].content.toLowerCase();
		}

		if(!["extreme", "bad", "mild", "squick", "squicks"].includes(category.toLowerCase())) 
			return msg.channel.createMessage("ERR: invalid category given. Aborting");

		if(args[0]) trigs = args[0].split("\n");
		else {
			await msg.channel.createMessage("Enter the triggers you'd like to remove, separated by new lines. You have 5 minutes to do this");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 5*60000, maxMatches: 1});
			if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out. Aborting");
			trigs = resp[0].content.toLowerCase().split("\n");
		}
		
		list.list[category] = list.list[category].filter(x => !trigs.includes(x.toLowerCase()));
		var scc = await bot.utils.updateTriggerList(bot, msg.author.id, list.hid, {list: list.list});
		if(scc) msg.channel.createMessage(`List updated!${!Object.keys(list.list).find(x => list.list[x][0]) ? " The list now has no triggers on it, but can still be edited" : ""}`);
		else msg.channel.createMessage("Something went wrong");
	}
}

module.exports.subcommands.delete = {
	help: ()=> "Delete a trigger list",
	usage: ()=> [" [hid] - Delete a trigger list with the given hid"],
	execute: async (bot, msg, args)=>{
		if(!args[0]) return msg.channel.createMessage("Please provide a list to delete");

		var list = await bot.utils.getTriggerList(bot, msg.author.id, args[0].toLowerCase());
		if(!list) return msg.channel.createMessage("List not found");
		if(list == "private" || list.user_id != msg.author.id) return msg.channel.createMessage("You do not have permission to delete that list");

		var scc = await bot.utils.deleteTriggerList(bot, msg.author.id, list.hid);
		if(scc) msg.channel.createMessage("List deleted!");
		else msg.channel.createMessage("Something went wrong");
	}
}

module.exports.subcommands.private = {
	help: ()=> "Set whether a trigger list is private or not",
	usage: ()=> [" [hid] [(true | 1) | (false | 0)] - Sets the privacy value of the given list"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a list and a value");
		var list = await bot.utils.getTriggerList(bot, msg.author.id, args[0].toLowerCase());
		if(!list) return msg.channel.createMessage("List not found");
		if(list == "private" || list.user_id != msg.author.id) return msg.channel.createMessage("You do not have permission to edit that list");

		var scc;
		switch(args[1].toLowerCase()) {
			case "1":
			case "true":
				scc = await bot.utils.updateTriggerList(bot, msg.author.id, list.hid, {private: true});
				break;
			case "0":
			case "false":
				scc = await bot.utils.updateTriggerList(bot, msg.author.id, list.hid, {private: false});
				break;
			default:
				return msg.channel.createMessage("ERR: invalid value given. Please provide a 1/true or 0/false for privacy")
				break;
		}

		if(scc) msg.channel.createMessage("List updated!");
		else msg.channel.createMessage("Something went wrong");
	}
}