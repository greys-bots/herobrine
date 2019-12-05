module.exports = {
	help: ()=> "Create custom commands",
	usage: ()=> [" - List current custom commands",
				 " add - Run a menu to create a new command",
				 " info [commandname] - Get info on a command",
				 " name [commandname] [newname] - Rename a command",
				 " delete [commandname] - Delete a custom command"],
	execute: async (bot, msg, args) => {
		var cmds = await bot.utils.getCustomCommands(bot, msg.guild.id);
		if(!cmds) return msg.channel.createMessage("No custom commands registered for this server");
		if(cmds.length > 5) {
			var embeds = await bot.utils.genEmbeds(bot, cmds, c => {
				return {
					name: `**${c.name}**`,
					value: [`**Target:** ${c.target}`,
							`**Delete after?** ${c.del == 1 ? "Yes" : "No"}`].concat(c.actions.map((a,i) => {
								return `**Action ${i+1}:** ${bot.customActionTypes.find(t => t.name == a.type).description}`
							})).join("\n")
				}
			}, {
				title: "Custom commands"
			}, 5);

			msg.channel.createMessage(embeds[0]).then(message => {
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
			})
		} else {
			msg.channel.createMessage({
				embed: {
					title: "Custom commands",
					fields: cmds.map(c => {
						return {
							name: `**${c.name}**`,
							value: [`**Target:** ${c.target}`,
							`**Delete after?** ${c.del == 1 ? "Yes" : "No"}`].concat(c.actions.map((a,i) => {
									return `**Action ${i+1}:** ${bot.customActionTypes.find(t => t.name == a.type).description}`
								})).join("\n")
						}
					})
				}
			})
		}
	},
	subcommands: {},
	alias: ["cc", "custom"],
	guildOnly: true,
	module: "admin"
}

module.exports.subcommands.add = {
	help: ()=> "WORK IN PROGRESS",
	usage: ()=> ["WORK IN PROGRESS"],
	execute: async (bot, msg, args) => {
		var name;
		var actions = [];
		var del;
		var response;
		var target;
		var done = false;
		await msg.channel.createMessage("Enter a name for the command.");
		try {
		response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.replace(/\s/g,"").toLowerCase();
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Action cancelled: timed out");
		}
		var cmd = await bot.utils.getCustomCommand(bot, msg.guild.id, response);
		if(cmd || bot.commands[response]) return msg.channel.createMessage("ERR: Command with that name exists. Aborting");
		name = response;

		await msg.channel.createMessage(`Who is the target of the command?
			\`\`\`
			user - the person that used the command
			args - people specified through arguments (using member IDs)
			\`\`\`
		`)
		response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();

		if(response == "user") target = "member";
		else if(response == "args") target = "args";
		else return msg.channel.createMessage("ERR: Invalid target. Aborting");

		try {
			for(var i = 0; i < 5; i++) {
				if(done) break;
				await msg.channel.createMessage(`Action number: ${actions.length+1}/5\nAvailable actions:
					\`\`\`
					rr - remove a role
					ar - add a role
					bl - blacklist user from using the bot
					\`\`\`
				Type "finished" to end action adding`);

				response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
				switch(response) {
					case "rr":
						await msg.channel.createMessage("Type the name of the role you want to remove.")
						response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
						if(!msg.guild.roles.find(r => r.name.toLowerCase() == response)) return msg.channel.createMessage("ERR: Role not found. Aborting");
						actions.push({type: "rr", action: `${target}.rr(rf('${response}'))`})
						break;
					case "ar":
						await msg.channel.createMessage("Type the name of the role you want to add.")
						response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
						if(!msg.guild.roles.find(r => r.name.toLowerCase() == response)) return msg.channel.createMessage("ERR: Role not found. Aborting");
						actions.push({type: "ar", action:`${target}.ar(rf('${response}'))`})
						break;
					case "bl":
						actions.push({type: "bl", action: `${target}.bl`})
						break;
					case "finished":
						done = true;
						break;
					default:
						return msg.channel.createMessage("ERR: Invalid action. Aborting");
						break;
				}

				if(!done) {
					await msg.channel.createMessage("Enter a success message for this action. NOTE: if using args as the target, this message will fire for every arg. Type `skip` to skip");
					response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content;
					if(response.toLowerCase() != "skip") actions[i].success = response;

					await msg.channel.createMessage("Enter a fail message for this action. NOTE: if using args as the target, this message will fire for every arg. Type `skip` to skip");
					response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content;
					if(response.toLowerCase() != "skip") actions[i].fail = response;
				}
			}
		} catch(e) {
			return msg.channel.createMessage("Action cancelled: timed out");
		}

		if(actions.length == 0) return msg.channel.createMessage("ERR: No actions added. Aborting");

		await msg.channel.createMessage("Would you like the user's message to be deleted? (y/n)");
		response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
		if(response == "y") del = true;
		else del = false;

		await msg.channel.createMessage({content: "Is this correct? (y/n)", embed: {
			title: name,
			description: (del ? "Message will be deleted after command execution" : "Message will not be deleted after command execution")+"\n"+
						 (target == "member" ? "Command will affect who is using it" : "Command will affect members given as arguments"),
			fields: actions.map((a, i) => {
				return {name: "Action "+(i+1), value: a.action}
			})
		}})

		response = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:1000*60*5, maxMatches: 1, }))[0].content.toLowerCase();
		if(response != "y") return msg.channel.createMessage("Action aborted");

		var scc = await bot.utils.addCustomCommand(bot, msg.guild.id, name, actions, target, del);
		if(scc) msg.channel.createMessage("Custom command added!");
		else msg.channel.createMessage("Something went wrong");
		// msg.channel.createMessage("This command is currently under construction. However, manual database editing can be used to create custom commands. USE WITH EXTREME CAUTION.")
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["create", "new", "+"]
}

module.exports.subcommands.info = {
	help: ()=> "Get info on a command",
	usage: ()=> [" [commandname] - Shows info on the given command"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a command to get info on");
		var cmd = await bot.utils.getCustomCommand(bot, msg.guild.id, args[0].toLowerCase());
		if(!cmd) return msg.channel.createMessage("Couldn't find that command");

		var actions = await bot.utils.parseCommandActions(bot, cmd);

		msg.channel.createMessage({
			embed: {
				title: `**${cmd.name}**`,
				description: `Target: ${cmd.target}\nDelete after? ${cmd.del == 1 ? "Yes" : "No"}`,
				fields: actions.map((a,i) => {
					return {
						name: `**Action ${i+1}**`,
						value: a
					}
				})
			}
		})

	},
	guildOnly: true,
	alias: ["?", "about"]
}

module.exports.subcommands.name = {
	help: ()=> "Rename a command",
	usage: ()=> [" [commandname] [newname] - Renames the given command"],
	execute: async (bot, msg, args) => {
		if(!args[1]) return msg.channel.createMessage("Please provide a command and the new name");
		var cmd = await bot.utils.getCustomCommand(bot, msg.guild.id, args[0].toLowerCase());
		if(!cmd) return msg.channel.createMessage("Couldn't find that command");

		var scc = await bot.utils.updateCustomCommand(bot, msg.guild.id, cmd.name, "name", args.slice(1).join("").toLowerCase());
		if(scc) msg.channel.createMessage("Custom command renamed!");
		else msg.channel.createMessage("Something went wrong");
	},
	alias: ["rename", "rn"],
	permissions: ["manageGuild"],
	guildOnly: true
}

module.exports.subcommands.delete = {
	help: ()=> "Delete a custom command",
	usage: ()=> [" [cmdName] - Deletes the given command"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a command to delete");

		var cmd = await bot.utils.getCustomCommand(bot, msg.guild.id, args[0]);
		if(!cmd) return msg.channel.createMessage("Command does not exist");

		var scc = await bot.utils.deleteCustomCommand(bot, msg.guild.id, args[0]);
		if(scc) msg.channel.createMessage("Command deleted!");
		else msg.channel.createMessage("Something went wrong");
	},
	guildOnly: true,
	alias: ["remove", "-"]
}