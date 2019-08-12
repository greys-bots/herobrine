
module.exports = {
	help: ()=> "Sets, views, or edits reaction roles for the server",
	usage: ()=> [" - Views available reaction role configs",
				 " add [role] (new line) [emoji] (new line) <description> - Creates a new reaction role config, description optional (NOTE: to allow multi-word role names, all other arguments must be separated by a new line)",
				 " delete [role] - Removes an existing reaction role config",
				 " emoji [role] [newemoji] - Changes the emoji for an existing reaction role",
				 " description [role] (new line) [new description] - Changes the description for an existing reaction role (NOTE: description must be on a new line)",
				 " post [channel] - Posts reaction roles in the given channel (NOTE: only saves one post at a time; posts ALL roles and overwrites their categories)"
				],
	execute: async (bot, msg, args) => {
		var roles = await bot.utils.getReactionRoles(bot, msg.guild.id);
		if(roles.length == 0 || !roles) return msg.channel.createMessage('No reaction roles available');
		var invalid = [];
		await msg.channel.createMessage({embed: {
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

		if(invalid.length > 0) {
			bot.db.query(`DELETE FROM reactroles WHERE role_id IN (`+invalid.join(", ")+")",(err, rows)=> {
				if(err) {
					console.log(err);
				} else {
					msg.channel.createMessage('Deleted reaction roles that no longer exist');
				}
			})
		}
	},
	alias: ['rr', 'reactroles', 'reactrole', 'reactionrole'],
	subcommands: {},
	permissions: ["manageRoles"]
}

module.exports.subcommands.add = {
	help: ()=> "Adds a new reaction role",
	usage: ()=> [" [role] (new line) [emoji] (new line) <description> - Creates a new reaction role config (NOTE: if emoji is custom, must be in the same server as the bot)"],
	execute: async (bot, msg, args)=> {
		var nargs = args.join(" ").split("\n");
		var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == nargs[0] || r.name.toLowerCase() == nargs[0].toLowerCase()).id;
		var emoji = nargs[1].replace(/[<>\s]/g,"");
		var description = nargs.slice(2).join("\n");
		bot.db.query(`INSERT INTO reactroles (server_id, role_id, emoji, description) VALUES (?,?,?,?)`,[
			msg.guild.id,
			role,
			emoji,
			description
		], (err, rows)=> {
			if(err) {
				console.log(err);
				msg.channel.createMessage('Something went wrong.');
			} else {
				msg.channel.createMessage('React role created!')
			}
		})
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
				   msg.guild.roles.find(r => r.id == args.join(" ") || r.name.toLowerCase() == args.join(" ").toLowerCase()).id;
		bot.db.query(`DELETE FROM reactroles WHERE role_id=?`,[role],async (err, rows)=>{
			if(err) {
				console.log(err);
				msg.channel.createMessage('Something went wrong');
			} else {
				msg.channel.createMessage('React role deleted! NOTE: does not delete the actual role, nor remove it from members who have it');
			}
		})
	},
	alias: ['delete'],
	permissions: ["manageRoles"]
}

module.exports.subcommands.post = {
	help: ()=> "Posts a message with all possible reaction roles. Use reaction categories or the `rr bind` command to post specific roles",
	usage: ()=> " [channel] - Posts reaction roles message in given channel",
	execute: async (bot, msg, args) => {
		var roles = await bot.utils.getReactionRoles(bot, msg.guild.id);
		if(!roles) return msg.channel.createMessage('No reaction roles available');

		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[0]);
		if(!channel) return msg.channel.createMessage('Channel not found');

		var invalid = [];

		await channel.createMessage({embed: {
			title: "Server Reaction Roles",
			description: "All available roles for the server",
			fields: roles.map(r => {
				var rl = msg.guild.roles.find(x => x.id == r.role_id);
				 if(rl) {
				 	return {name: `${rl.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`, value: r.description || "*(no description provided)*"}
				 } else {
				 	invalid.push(r.role_id);
				 	return null;
				 }
			}).filter(x => x!= null)
		}}).then(m => {
			var reacts = roles.map(r => r.emoji);
			reacts.forEach(rc => m.addReaction(rc));
			bot.db.query(`INSERT INTO reactposts (server_id, channel_id, message_id, roles) VALUES (?,?,?,?)`, [
				m.guild.id,
				m.channel.id,
				m.id,
				roles.map(r => { return {emoji: r.emoji, role_id: r.role_id} })
			])
		})

		if(invalid.length > 0) {
			bot.db.query(`DELETE FROM reactroles WHERE role_id IN (`+invalid.join(", ")+")",(err, rows)=> {
				if(err) {
					console.log(err);
				} else {
					msg.channel.createMessage('Deleted reaction roles that no longer exist');
				}
			})
		}
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.bind = {
	help: ()=> "Binds a reaction role to a certain message.",
	usage: ()=> [" [role name] [channel] [messageID] - Binds a role to the message"],
	execute: async (bot, msg, args) => {
		if(!args[2]) return msg.channel.createMessage("This command requires at least 3 arguments.");
		console.log(args.slice(0, args.length-3));
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

		var post = await bot.utils.getReactionRolePost(bot, message.guild.id, message.id);
		console.log(post);
		if(post) {
			post.roles.push({emoji: role.emoji, role_id: role.role_id});
			bot.db.query(`UPDATE reactposts SET roles=? WHERE server_id=? AND channel_id=? AND message_id=?`,[post.roles, message.guild.id, message.channel.id, message.id], (err, rows)=> {
				if(err) {
					console.log(err);
					msg.channel.createMessage('Something went wrong')
				} else {
					msg.channel.createMessage('React role bound!')
					message.addReaction(role.emoji.replace("^:",""));
				}
			});
		} else {
			post = [
			message.guild.id,
			message.channel.id,
			message.id,
			[{emoji: role.emoji, role_id: role.role_id}]
			];
			bot.db.query(`INSERT INTO reactposts (server_id, channel_id, message_id, roles) VALUES (?,?,?,?)`,post, (err, rows)=> {
				if(err) {
					console.log(err);
					msg.channel.createMessage('Something went wrong')
				} else {
					msg.channel.createMessage('React role bound!')
					message.addReaction(role.emoji.replace("^:",""));
				}
			})
		}
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.update = {
	help: ()=> "Updates a react role post (eg: in case roles have been deleted)",
	usage: ()=> [" [channel] [messageID] - Updates the given role post. Must belong to the bot in order to be updated"],
	execute: async (bot, msg, args) => {
		var roles = await bot.utils.getReactionRoles(bot, msg.guild.id);
		if(!roles) return msg.channel.createMessage('No reaction roles available');

		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[0]);
		if(!channel) return msg.channel.createMessage('Channel not found');

		var message;

		var invalid;
		roles = roles.map(r => {
							var rl = msg.guild.roles.find(x => x.id == r.role_id);
							 if(rl) {
							 	return r
							 } else {
							 	invalid.push(r.role_id);
							 	return null							
							 }
						}).filter(x => x!=null);
		try {
			message = await bot.getMessage(channel.id, args[1]);
		} catch(e) {
			return msg.channel.createMessage("Message not found");
		}

		if(message.author.id != bot.user.id) return msg.channel.createMessage("Message must belong to me in order to be updated");

		try {
			await bot.utils.updateReactRolePost(bot, message, roles);
		} catch(e) {
			console.log(e)
			return msg.channel.createMessage("Something went wrong");
		}
		msg.channel.createMessage("Post updated!")

		var invalid = roles.map(r => {
			var rl = msg.guild.roles.find(x => x.id == r.role_id);
			 if(!rl) {
			 	return r.role_id;
			 } else {
			 	return null;
			 }
		}).filter(x => x!=null);

		if(invalid.length > 0) {
			bot.db.query(`DELETE FROM reactroles WHERE role_id IN (`+invalid.join(", ")+")",(err, rows)=> {
				if(err) {
					console.log(err);
				} else {
					msg.channel.createMessage('Deleted reaction roles that no longer exist');
				}
			})
		}	

	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.emoji = {
	help: ()=> "Changes emoji for a role",
	usage: ()=> " [role] [emoji] - Changes emoji for the given role",
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
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.description = {
	help: ()=> "Changes description for a role",
	usage: ()=> " [role] (new line) [description] - Changes description for the given role",
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
	},
	alias: ["describe", "desc"],
	permissions: ["manageRoles"]
}