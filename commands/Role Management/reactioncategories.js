module.exports = {
	help: ()=> "Creates categories for reaction roles",
	usage: ()=> [" - Lists available categories and their IDs",
				 " [hid] - Gets info on a category",
				 " create [name] [description] - Creates new react role category",
				 " delete [ID] - Deletes category (does not delete associated reaction roles)",
				 " add [ID] [role] - Adds react role to the category",
				 " remove [ID] [role] - Removes react role from the category",
				 " name [ID] [new name] - Changes category name",
				 " description [ID] [new desription] - Changes category description",
				 " post [ID] [channel] - Posts category's roles in a channel"],
	execute: async (bot, msg, args)=> {
		if(args[0]) {
			var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0].toLowerCase());
			if(!category) return msg.channel.createMessage("Category not found");
			console.log(category);
			if(!category.roles || !category.roles[0]) return msg.channel.createMessage("That category has no roles indexed");

			var invalid = [];
			var embeds = await bot.utils.genEmbeds(bot, category.roles, rl => {
				var role = msg.guild.roles.find(r => r.id == rl.role_id);
				if(role) {
					return {name: `${role.name} (${rl.emoji.includes(":") ? `<${rl.emoji}>` : rl.emoji})`, value: rl.description || "*(no description provided)*"}
				} else {
					invalid.push(rl.role_id);
					return {name: rl.role_id, value: '*(invalid role)*'}
				}
			}, {
				title: `${category.name} (${category.hid})`,
				description: category.description,
			}, 10);

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
							if(message.channel.guild) message.removeReactions();
						} catch(e) {
							console.log(e);
						}
						delete bot.menus[message.id];
					}, 900000),
					execute: bot.utils.paginateEmbeds
				};
				["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
			}

			if(invalid[0]) {
				var scc = await bot.utils.deleteReactionRoles(bot, msg.guild.id, invalid);
				if(scc) msg.channel.createMessage("Invalid reaction roles have been deleted");
				else msg.channel.createMessage("Something went wrong while removing invalid reaction roles");
			}
			return;
		}

		var categories = await bot.utils.getReactionCategories(bot, msg.guild.id);
		if(!categories || !categories[0]) return msg.channel.createMessage('No categories have been indexed');

		var embeds = [];
		var err = false;
		for(category of categories) {
			var invalid = [];

			var tmp;
			if(category.roles && category.roles[0]) {
				tmp = await bot.utils.genEmbeds(bot, category.roles, rl => {
					var role = msg.guild.roles.find(r => r.id == rl.role_id);
					if(role) {
						return {name: `${role.name} (${rl.emoji.includes(":") ? `<${rl.emoji}>` : rl.emoji})`, value: rl.description || "*(no description provided)*"}
					} else {
						invalid.push(rl.role_id);
						return {name: rl.role_id, value: '*(invalid role)*'}
					}
				}, {
					title: category.name,
					description: category.description,
					footer: {text: `ID: ${category.hid}`}
				}, 10, {addition: ""});
			} else {
				tmp = {embed: {
					title: `${category.name} (${category.hid})`,
					description: category.description,
					fields: [
						{name: "No roles", value: "This category has no roles indexed"}
					]
				}}
			}
			embeds = embeds.concat(tmp);

			if(invalid[0]) {
				var scc = await bot.utils.deleteReactionRoles(bot, msg.guild.id, invalid);
				if(!scc) err = true;
			}
		}

		embeds.forEach((e, i) => e.embed.title = `${e.embed.title} (page ${i+1}/${embeds.length}, ${categories.length} categories total)`);

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
						if(message.channel.guild) message.removeReactions();
					} catch(e) {
						console.log(e);
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
		}

		if(err) {
			msg.channel.createMessage("Some invalid roles could not be deleted");
		}	
	},
	alias: ['reactcategories', 'rc'],
	permissions: ["manageRoles"],
	subcommands: {},
	module: "utility"
}

module.exports.subcommands.create = {
	help: ()=> "Creates a new reaction role category",
	usage: ()=> [" [name] (new line) [description] - Creates a new category with the given name and description (NOTE: description needs to be on new line)"],
	execute: async (bot, msg, args)=> {
		var nargs = args.join(" ").split("\n");
		var code = bot.utils.genCode(4, bot.strings.codestab);
		var scc = await bot.utils.createReactionCategory(bot, code, msg.guild.id, nargs[0], nargs.slice(1).join("\n"))
		if(scc) msg.channel.createMessage("Category created! ID: "+code);
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageRoles"],
	alias: ["new", "+"]
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
	permissions: ["manageRoles"],
	alias: ["del", "-"]
}

module.exports.subcommands.name = {
	help: ()=> "Changes name for a category",
	usage: ()=> [" [ID] [name] - Changes name for the given category"],
	execute: async (bot, msg, args)=> {
		var category = bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');

		var scc = await bot.utils.updateReactionCategory(bot, msg.guild.id, category.hid, "name", args.slice(1).join(" "))
		if(scc) msg.channel.createMessage("Category updated!");
		else msg.channel.createMessage("Something went wrong");
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

		var scc = await bot.utils.updateReactionCategory(bot, msg.guild.id, category.hid, "description", args.slice(1).join(" "))
		if(scc) msg.channel.createMessage("Category updated!");
		else msg.channel.createMessage("Something went wrong");
	},
	alias: ["describe", "desc"],
	permissions: ["manageRoles"]
}

module.exports.subcommands.add = {
	help: ()=> "Changes description for a category",
	usage: ()=> [" [ID] [comma, separated, role names] - Adds role to a category"],
	execute: async (bot, msg, args)=> {
		var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category) return msg.channel.createMessage('Category does not exist');
		if(!category.roles || typeof category.roles != "object") category.roles = [];

		var result = [];
		var roles = args.slice(1).join(" ").split(/,\s+/g);
		var max = await bot.utils.getHighestPage(bot, msg.guild.id, category.hid);
		for(var i = 0; i < roles.length; i++) {
			var role = msg.guild.roles.find(r => r.id == roles[i].replace(/[<#>]/g,"") || r.name.toLowerCase() == roles[i].toLowerCase());
			if(!role) {
				result.push({succ: false, name: roles[i], reason: "Role not found"});
				continue;
			}

			var rr = await bot.utils.getReactionRole(bot, msg.guild.id, role.id);
			if(!rr) {
				result.push({succ: false, name: role.name, reason: "React role not found"});
				continue;
			}

			if(category.rawroles.indexOf(rr.id) > -1) {
				result.push({succ: false, name: role.name, reason: "React role already in category"});
			} else if(category.roles.find(r => r.emoji == rr.emoji)) {
				result.push({succ: true, name: role.name, reason: "React role with that emoji already in category"});
			} else {
				result.push({succ: true, name: role.name});
				category.rawroles.push(rr.id);
			}
		}
		
		var scc = await bot.utils.updateReactionCategory(bot, msg.guild.id, category.hid, "roles", category.rawroles);
		if(!scc) return msg.channel.createMessage("Something went wrong");

		msg.channel.createMessage({ embed: {
			title: "Results",
			fields: [
				{name: "Added", value: result.filter(r => r.succ).map(r => r.name).join("\n") || "none"},
				{name: "Not Added", value: result.filter(r => !r.succ).map(r => `${r.name} - ${r.reason}`).join("\n") || "none"},	
			]
		}})

		if(Math.ceil(category.roles.length/10)-1 > max) {
			msg.channel.createMessage(
				"The category has been updated- however, because the amount of roles is greater than "+
				"the amount that the current number of pages can handle, the posts have not been updated.\n"+
				"If you would like for all the roles to be visible, **delete the current posts** and use "+
				"`hub!rc post "+category.hid+" (channel)` to post them again."
			)
		} else {
			scc = await bot.utils.updateReactCategoryPosts(bot, msg.guild.id, msg, category.hid);
			if(scc.filter(x => !x.success).length > 0) msg.channel.createMessage("Something went wrong while updating posts")
		}
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
		for(var i = 0; i < roles.length; i++) {
			var role = msg.guild.roles.find(r => r.id == roles[i].replace(/[<#>]/g,"") || r.name.toLowerCase() == roles[i].toLowerCase());
			if(!role) {
				result.push({succ: false, name: roles[i], reason: "Role not found"});
				continue;
			}

			var rr = await bot.utils.getReactionRole(bot, msg.guild.id, role.id);
			if(!rr) {
				result.push({succ: false, name: role.name, reason: "React role not found"});
				continue;
			}

			result.push({succ: true, name: role.name});
			category.rawroles = category.roles.filter(x => x != rr.id);
		}

		var scc = await bot.utils.updateReactionCategory(bot, msg.guild.id, category.hid, "roles", category.rawroles);
		if(!scc) return msg.channel.createMessage("Something went wrong");

		msg.channel.createMessage({ embed: {
			title: "Results",
			fields: [
				{name: "Removed", value: result.filter(r => r.succ).map(r => r.name).join("\n") || "none"},
				{name: "Not removed", value: result.filter(r => !r.succ).map(r => `${r.name} - ${r.reason}`).join("\n") || "none"},	
			]
		}})
		scc = await bot.utils.updateReactCategoryPosts(bot, msg.guild.id, msg, category.hid);
		if(scc.filter(x => !x.success).length > 0) msg.channel.createMessage("Something went wrong while updating posts")
		else if(category.roles.length == 0) msg.channel.createMessage("Category empty; posts have been deleted. This does not remove the category itself");
		else if(Math.ceil(category.rawroles.length/10)-1 < max) msg.channel.createMessage("Extra posts have been deleted")
	},
	permissions: ["manageRoles"]
}

module.exports.subcommands.post = {
	help: ()=> "Posts a message with all possible reaction roles",
	usage: ()=> [" [category] [channel] - Posts reaction roles message in given channel"],
	execute: async (bot, msg, args) => {
		var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category) return msg.channel.createMessage('Category does not exist');

		var channel = msg.guild.channels.find(ch => ch.id == args[1].replace(/[<#>]/g,"") || ch.name == args[1].toLowerCase());
		if(!channel) return msg.channel.createMessage('Channel not found');

		var roles = category.roles;

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

			var message = await channel.createMessage({embed: {
				title: category.name,
				description: category.description,
				fields: rls
			}})

			reacts.forEach(rc => message.addReaction(rc));

			var scc = await bot.utils.addReactPost(
				bot, message.guild.id, message.channel.id, message.id,
				roles.map(r => { return {emoji: r.emoji, role_id: r.role_id} }), 0
			);
			if(!scc) return msg.channel.createMessage("Something went wrong");

			category.posts.push(message.id);
			scc = await bot.utils.updateReactionCategory(bot, msg.guild.id, category.hid, "posts", category.posts)
			if(scc) msg.channel.createMessage("Posted!");
			else msg.channel.createMessage("Something went wrong");
		} else {
			var err = false;
			var scc;
			var posts = await bot.utils.genReactPosts(bot, roles, msg, {
				title: category.name,
				description: category.description
			})

			for(var i = 0; i < posts.length; i++) {
				var message = await channel.createMessage({embed: posts[i].embed});
				posts[i].emoji.forEach(rc => message.addReaction(rc));
				scc = await bot.utils.addReactPost(
					bot, message.guild.id, message.channel.id, message.id,
					posts[i].roles, i
				);
				if(!scc) {
					err = true;
					continue
				}
				category.posts.push(message.id);
				scc = await bot.utils.updateReactionCategory(bot, msg.guild.id, category.hid, "posts", category.posts);
				if(!scc) err = true;
			}

			if(err) msg.channel.createMessage("Some posts may not have been indexed correctly");
			else msg.channel.createMessage("Posted!");
		}
	},
	permissions: ["manageRoles"]
}