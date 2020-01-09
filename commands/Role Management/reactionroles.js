
module.exports = {
	help: ()=> "Sets, views, or edits reaction roles for the server",
	usage: ()=> [" - Views available reaction role configs",
				 " add [role] (new line) [emoji] (new line) <description> - Creates a new reaction role config, description optional (NOTE: to allow multi-word role names, all other arguments must be separated by a new line)",
				 " delete [role] - Removes an existing reaction role config",
				 " emoji [role] [newemoji] - Changes the emoji for an existing reaction role",
				 " description [role] (new line) [new description] - Changes the description for an existing reaction role (NOTE: description must be on a new line)"
				],
	execute: async (bot, msg, args) => {
		var roles = await bot.utils.getReactionRoles(bot, msg.guild.id);
		if(roles.length == 0 || !roles) return msg.channel.createMessage('No reaction roles available');
		var invalid = [];
		if(roles.length > 10) {
			var embeds = await bot.utils.genEmbeds(bot, roles, async dat => {
				var rl = msg.guild.roles.find(x => x.id == dat.role_id);
				 if(rl) {
				 	return {name: `${rl.name} (${dat.emoji.includes(":") ? `<${dat.emoji}>` : dat.emoji})`, value: dat.description || "*(no description provided)*"}
				 } else {
				 	return {name: dat.role_id, value: '*Role not found. Removing after list.*'}
				 }
			}, {
				title: "Server Reaction Roles",
				description: "All available roles for the server",
			}, 10);

			embeds.forEach(e => {
				console.log(e)
				if(e.embed.fields) {
					console.log(e.fields)
					e.embed.fields.forEach(f => {
						if(f.value == '*Role not found. Removing after list.*')
						invalid.push(f.name);
					})
				}
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
			};
			message.addReaction("\u2b05");
			message.addReaction("\u27a1");
			message.addReaction("\u23f9");
		} else {
			msg.channel.createMessage({ embed: {
				title: "Server Reaction Roles",
				description: "All available roles for the server",
				fields: roles.map(r => {
					var rl = msg.guild.roles.find(x => x.id == r.role_id);
					 if(rl) {
					 	return {name: `${rl.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`, value: r.description || "*(no description provided)*"}
					 } else {
					 	invalid.push(r.role_id);
					 	return {name: r.role_id, value: '*Role not found. Removing after list.*'}
					 }
				})
			}})
		}

		if(invalid.length > 0) {
			console.log(invalid);
			await bot.utils.asyncForEach(invalid, async r => {
				await bot.utils.deleteReactionRole(bot, msg.guild.id, r);
			})
		}
	},
	alias: ['rr', 'reactroles', 'reactrole', 'reactionrole'],
	subcommands: {},
	permissions: ["manageRoles"],
	module: "utility"
}

module.exports.subcommands.add = {
	help: ()=> "Adds a new reaction role",
	usage: ()=> [" [role] (new line) [emoji] (new line) <description> - Creates a new reaction role config (NOTE: if emoji is custom, must be in the same server as the bot)"],
	execute: async (bot, msg, args)=> {
		var nargs = args.join(" ").split("\n");
		var arg1 = nargs[0].split(" ");
		var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == arg1.slice(0, arg1.length-1).join(" ") || r.name.toLowerCase() == arg1.slice(0, arg1.length-1).join(" ").toLowerCase());
		if(!role) return msg.channel.createMessage("Role not found");
		var emoji = arg1.slice(-1)[0].replace(/[<>\s]/g,"");
		var description = nargs.slice(1).join("\n");

		var scc = await bot.utils.addReactionRole(bot, msg.guild.id, role.id, emoji, description);
		if(scc) msg.channel.createMessage("React role created!");
		else msg.channel.createMessage("Something went wrong")
	},
	alias: ['create', 'new'],
	permissions: ["manageRoles"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes a reaction role config",
	usage: ()=> [" [role] - Removes config for the role (NOTE: roles that are deleted automatically have their config removed when posting or listing configs"],
	execute: async (bot, msg, args)=> {
		var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == args.join(" ") || r.name.toLowerCase() == args.join(" ").toLowerCase());
		if(!role) return msg.channel.createMessage("Role not found");
		var scc = await bot.utils.deleteReactionRole(bot, msg.guild.id, role.id);
		if(!scc) msg.channel.createMessage("Something went wrong");
		else msg.channel.createMessage('React role deleted! NOTE: does not delete the actual role, nor remove it from members who have it');
	},
	alias: ['delete'],
	permissions: ["manageRoles"]
}

module.exports.subcommands.bind = {
	help: ()=> "Binds a reaction role to a certain message.",
	usage: ()=> [" [role name] [channel] [messageID] - Binds a role to the message"],
	execute: async (bot, msg, args) => {
		if(!args[2]) return msg.channel.createMessage("This command requires at least 3 arguments.");
		var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == args[0] || r.name.toLowerCase() == args.slice(0, args.length-2).join(" ").toLowerCase());
		if(!role) return msg.channel.createMessage("Role not found");
		role = await bot.utils.getReactionRole(bot, msg.guild.id, role.id);
		if(!role) return msg.channel.createMessage("Reaction role not found");
		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[args.length - 2] || ch.name == args[args.length - 2]);
		if(!channel) return msg.channel.createMessage("Channel not found.");
		var message = await bot.getMessage(channel.id, args[args.length-1]);
		if(!message) return msg.channel.createMessage("Invalid message");

		var post = await bot.utils.getReactPost(bot, message.guild.id, message.id);
		console.log(post);
		if(post) {
			if(post.roles.find(r => r.role_id == role.role_id)) {
				msg.channel.createMessage("That role is already bound to that message.");
			} else if(post.roles.find(r => r.emoji == role.emoji)) {
				msg.channel.createMessage("A role with that emoji is already bound to that message.");
			} else {
				post.roles.push({emoji: role.emoji, role_id: role.role_id});
				var scc = await bot.utils.editReactPost(bot, message.guild.id, message.channel.id, message.id, post.roles);
				if(scc) {
					msg.channel.createMessage("React role bound!");
					message.addReaction(role.emoji.replace("^:",""));
				} else msg.channel.createMessage("Something went wrong");
			}
			
		} else {
			var scc = await bot.utils.addReactPost(bot, message.guild.id, message.channel.id, message.id, [{emoji: role.emoji, role_id: role.role_id}, 0]);
			if(scc) msg.channel.createMessage("React role bound!");
			else msg.channel.createMessage("Something went wrong");
		}
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.emoji = {
	help: ()=> "Changes emoji for a role",
	usage: ()=> [" [role] [emoji] - Changes emoji for the given role"],
	execute: async (bot, msg, args)=> {
		var roles = await bot.utils.getReactionRoles(bot, msg.guild.id);
		if(!roles || roles.length == 0) return msg.channel.createMessage('No reaction roles available');
		var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == args.slice(0, -1).join(" ") || r.name.toLowerCase() == args.slice(0, -1).join(" ").toLowerCase()).id;
		var emoji = args[args.length - 1].replace(/[<>]/g,"");
		if(!role || (role && !roles.find(r => r.role_id == role)))
			return msg.channel.createMessage('Role does not exist');

		bot.db.query(`UPDATE reactroles SET emoji=? WHERE role_id=?`,[emoji, role],(err,rows)=> {
			if(err) {
				console.log(err);
				msg.channel.createMessage('Something went wrong');
			} else {
				msg.channel.createMessage('Emoji changed!')
			}
		})

		var posts = await bot.utils.getReactPostswithRole(bot, msg.guild.id, role);
		if(posts) {
			var scc = await bot.utils.updateReactPosts(bot, msg.guild.id, posts.map(p => p.message_id));
			if(!scc) msg.channel.createMessage("Something went wrong while updating posts.");
		}
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.description = {
	help: ()=> "Changes description for a role",
	usage: ()=> [" [role] (new line) [description] - Changes description for the given role"],
	execute: async (bot, msg, args)=> {
		var roles = await bot.utils.getReactionRoles(bot, msg.guild.id);
		if(!roles || roles.length == 0) return msg.channel.createMessage('No reaction roles available');
		var nargs = args.join(" ").split("\n");
		var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == nargs[0] || r.name.toLowerCase() == nargs[0].toLowerCase()).id;
		if(!role || (role && !roles.find(r => r.role_id == role)))
			return msg.channel.createMessage('Role does not exist');

		bot.db.query(`UPDATE reactroles SET description=? WHERE role_id=?`,[nargs.slice(1).join("\n"), role],(err,rows)=> {
			if(err) {
				console.log(err);
				msg.channel.createMessage('Something went wrong');
			} else {
				msg.channel.createMessage('Description changed!')
			}
		})
		var posts = await bot.utils.getReactPostswithRole(bot, msg.guild.id, role);
		if(posts) {
			var scc = await bot.utils.updateReactPosts(bot, msg.guild.id, posts.map(p => p.message_id));
			if(!scc) msg.channel.createMessage("Something went wrong while updating posts.");
		}
	},
	alias: ["describe", "desc"],
	permissions: ["manageRoles"]
}