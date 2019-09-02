module.exports = {
	help: ()=> "Creates categories for reaction roles",
	usage: ()=> [" - Lists available categories and their IDs",
				 " create [name] [description] - Creates new react role category",
				 " delete [ID] - Deletes category (does not delete associated reaction roles)",
				 " add [ID] [role] - Adds react role to the category",
				 " remove [ID] [role] - Removes react role from the category",
				 " name [ID] [new name] - Changes category name",
				 " description [ID] [new desription] - Changes category description",
				 " post [channel] <ID> - Posts category's roles in a channel. If no category is given, posts all",
				 " info [ID] - Gets info on a category (eg: roles registered to it)"],
	execute: async (bot, msg, args)=> {
		var categories = await bot.utils.getReactionCategories(bot, msg.guild.id);
		if(!categories || categories.length < 1) return msg.channel.createMessage('No categories have been indexed');

		msg.channel.createMessage({embed: {
			title: "Categories",
			description: "All categories registered for the server",
			fields: categories.map(c => {
				return {name: c.name, value: `ID: ${c.hid}\nDescription: ${c.description}`}
			})
		}})
	},
	alias: ['reactcategories', 'rc'],
	permissions: ["manageRoles"],
	subcommands: {}
}

module.exports.subcommands.create = {
	help: ()=> "Creates a new reaction role category",
	usage: ()=> [" [name] (new line) [description] - Creates a new category with the given name and description (NOTE: description needs to be on new line)"],
	execute: async (bot, msg, args)=> {
		var nargs = args.join(" ").split("\n");
		var code = bot.utils.genCode(4, bot.strings.codestab);
		bot.db.query(`INSERT INTO reactcategories (hid, server_id, name, description, roles, posts) VALUES (?,?,?,?,?,?)`,[
			code,
			msg.guild.id,
			nargs[0],
			nargs.slice(1).join("\n"),
			[],
			[]
		], (err, rows)=> {
			if(err) {
				console.log(err);
				msg.channel.createMessage('Something went wrong')
			} else {
				msg.channel.createMessage("Category created! ID: "+code);
			}
		})
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes a category",
	usage: ()=> [" [id] - Deletes a reaction category"],
	execute: async (bot, msg, args) => {
		var category = bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');
		await bot.utils.deleteReactionCategory(bot, msg.guild.id, args[0]);
		msg.channel.createMessage("Category deleted!");
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.name = {
	help: ()=> "Changes name for a category",
	usage: ()=> [" [ID] [name] - Changes name for the given category"],
	execute: async (bot, msg, args)=> {
		var category = bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');

		bot.db.query(`UPDATE reactcategories SET name=? WHERE hid=?`,[args.slice(1).join(" "), args[0]],(err,rows)=> {
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

module.exports.subcommands.description = {
	help: ()=> "Changes description for a category",
	usage: ()=> [" [ID] [description] - Changes description for the given category"],
	execute: async (bot, msg, args)=> {
		var category = bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');

		bot.db.query(`UPDATE reactcategories SET description=? WHERE hid=?`,[args.slice(1).join(" "), args[0]],(err,rows)=> {
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

module.exports.subcommands.add = {
	help: ()=> "Changes description for a category",
	usage: ()=> [" [ID] [comma, separated, role names] - Adds role to a category"],
	execute: async (bot, msg, args)=> {
		var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');

		var result = [];
		var roles = args.slice(1).join(" ").split(/,\s+/g);
		var max = await bot.utils.getHighestPage(bot, msg.guild.id, category.hid);
		await Promise.all(roles.map(async rl => {
			var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == rl || r.name.toLowerCase() == rl.toLowerCase());
			if(!role) {
				result.push({succ: false, name: rl, reason: "Role not found"})
				return new Promise(res => setTimeout(()=> res(0), 100))
			}
			role = role.id;
			var rr = await bot.utils.getReactionRole(bot, msg.guild.id, role);
			if(!rr) {
				result.push({succ: false, name: rl, reason: "React role not found"});
				return new Promise(res => setTimeout(()=> res(0), 100))
			} else {
				var existing = await bot.utils.getReactionRolesByCategory(bot, msg.guild.id, category.hid);
				if(category.roles.find(r => r == rr.id)) {
					result.push({succ: false, name: rl, reason: "React role already in category"});
					return new Promise(res => setTimeout(()=> res(0), 100))
				} else if(existing.find(r => r.emoji == rr.emoji)) {
					result.push({succ: false, name: rl, reason: "React role with that emoji already in category"});
					return new Promise(res => setTimeout(()=> res(0), 100))
				} else {
					result.push({succ: true, name: rl});
					category.roles.push(rr.id);
					return new Promise(res => setTimeout(()=> res(0), 100))
				}
			}
			
		})).then(()=> {
			bot.db.query(`UPDATE reactcategories SET roles=? WHERE server_id=? AND hid=?`,[category.roles, msg.guild.id, category.hid], async (err, rows)=>{
				if(err) {
					console.log(err);
					msg.channel.createMessage('Something went wrong')
				} else {
					msg.channel.createMessage({ embed: {
						title: "Results",
						fields: [
							{name: "Added", value: result.filter(r => r.succ).map(r => r.name).join("\n") || "none"},
							{name: "Not Added", value: result.filter(r => !r.succ).map(r => `${r.name} - ${r.reason}`).join("\n") || "none"},	
						]
					}})
					if(Math.ceil(category.roles.length/10)-1 > max) {
						msg.channel.createMessage("The category has been updated- however, because the amount of roles is greater than "+
												  "the amount that the current number of pages can handle, the posts have not been updated.\n"+
												  "If you would like for all the roles to be visible, **delete the current posts** and use "+
												  "`hub!rc post "+category.hid+" (channel)` to post them again.")
					} else {
						var sc = await bot.utils.updateReactCategoryPosts(bot, msg.guild.id, msg, category.hid);
						if(!sc) msg.channel.createMessage("Something went wrong while updating posts")
					}
				}
			})

		})

		
		
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.remove = {
	help: ()=> "Changes description for a category",
	usage: ()=> [" [ID] [role] - Adds role to a category"],
	execute: async (bot, msg, args)=> {
		var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');

		var result = [];
		var roles = args.slice(1).join(" ").split(/,\s+/g);
		var max = await bot.utils.getHighestPage(bot, msg.guild.id, category.hid);
		await Promise.all(roles.map(async rl => {
			var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == rl || r.name.toLowerCase() == rl.toLowerCase());
			if(!role) {
				result.push({succ: false, name: rl, reason: "Role not found"})
				return new Promise(res => setTimeout(()=> res(0), 100))
			}
			role = role.id;
			var rr = await bot.utils.getReactionRole(bot, msg.guild.id, role);
			if(!rr) {
				result.push({succ: false, name: rl, reason: "React role not found"});
				return new Promise(res => setTimeout(()=> res(0), 100))
			}
			else {
				result.push({succ: true, name: rl});
				category.roles = category.roles.filter(x => x != rr.id);
				return new Promise(res => setTimeout(()=> res(0), 100))
			}
			
		})).then(()=> {
			bot.db.query(`UPDATE reactcategories SET roles=? WHERE server_id=? AND hid=?`,[category.roles, msg.guild.id, category.hid], async (err, rows)=>{
				if(err) {
					console.log(err);
					msg.channel.createMessage('Something went wrong')
				} else {
					msg.channel.createMessage({ embed: {
						title: "Results",
						fields: [
							{name: "Removed", value: result.filter(r => r.succ).map(r => r.name).join("\n") || "none"},
							{name: "Not removed", value: result.filter(r => !r.succ).map(r => `${r.name} - ${r.reason}`).join("\n") || "none"},	
						]
					}})
					var sc = await bot.utils.updateReactCategoryPosts(bot, msg.guild.id, msg, category.hid);
					if(!sc) msg.channel.createMessage("Something went wrong while updating posts")
					else if(category.roles.length == 0) msg.channel.createMessage("Category empty; posts have been deleted. This does not remove the category itself");
					else if(Math.ceil(category.roles.length/10)-1 < max) msg.channel.createMessage("Extra posts have been deleted.")
				}
			})

		})
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.post = {
	help: ()=> "Posts a message with all possible reaction roles",
	usage: ()=> [" [category] [channel] - Posts reaction roles message in given channel"],
	execute: async (bot, msg, args) => {
		var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category) return msg.channel.createMessage('Category does not exist');

		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[0]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[1]);
		if(!channel) return msg.channel.createMessage('Channel not found');

		var roles = await bot.utils.getReactionRolesByCategory(bot, msg.guild.id, category.hid);

		if(roles.length < 10) {
			var reacts = [];
			var pass = []

			var rls = roles.map(r => {
				var role = msg.guild.roles.find(x => x.id == r.role_id);
				if(role){
					reacts.push(r.emoji);
					pass.push(r.role_id);
				 	return {name: `${role.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`,
				 			value: r.description || "*(no description provided)*\n\n"};
				} else {
				 	return undefined
				}
			}).filter(x => x!=undefined);

			await channel.createMessage({embed: {
				title: category.name,
				description: category.description,
				fields: rls
			}}).then(message => {
				reacts.forEach(rc => message.addReaction(rc));

				bot.db.query(`INSERT INTO reactposts (server_id, channel_id, message_id, roles, page) VALUES (?,?,?,?,?)`, [
					message.guild.id,
					message.channel.id,
					message.id,
					roles.map(r => { return {emoji: r.emoji, role_id: r.role_id} }),
					0
				])
				category.posts.push(message.id);
				bot.db.query(`UPDATE reactcategories SET posts=? WHERE server_id=? AND hid=?`,[category.posts, msg.guild.id, category.hid]);
			})
		} else {
			var posts = await bot.utils.genReactPosts(bot, roles, msg, {
				title: category.name,
				description: category.description
			})

			await Promise.all(posts.map(async (p,i) => {
				await channel.createMessage({embed: p.embed}).then(message => {
					p.emoji.forEach(rc => message.addReaction(rc));
					bot.db.query(`INSERT INTO reactposts (server_id, channel_id, message_id, roles, page) VALUES (?,?,?,?,?)`, [
						message.guild.id,
						message.channel.id,
						message.id,
						p.roles,
						i
					])
					category.posts.push(message.id);
					bot.db.query(`UPDATE reactcategories SET posts=? WHERE server_id=? AND hid=?`,[category.posts, msg.guild.id, category.hid]);
					return Promise.resolve("");
				})
			}))
		}
		
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.info = {
	help: ()=> "Get info on a reaction category",
	usage: ()=> [" [id] - Get info on a reaction category"],
	execute: async (bot, msg, args) => {
		var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category) return msg.channel.createMessage('Category does not exist');

		var roles = await bot.utils.getReactionRolesByCategory(bot, msg.guild.id, args[0]);
		if(roles.length == 0 || !roles) return msg.channel.createMessage('No reaction roles available');
		var invalid = [];
		await msg.channel.createMessage({embed: {
			title: `${category.name} (${category.hid})`,
			description: category.description,
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
	permissions: ["manageRoles"]
}