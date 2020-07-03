
module.exports = {
	help: ()=> "Sets, views, or edits reaction roles for the server.",
	usage: ()=> [" - Views available reaction role configs",
				 " add [role] [emoji] (new line) <description> - Creates a new reaction role config, description optional (NOTE: to allow multi-word role names, all other arguments must be separated by a new line)",
				 " delete [role] - Removes an existing reaction role config",
				 " emoji [role] [newemoji] - Changes the emoji for an existing reaction role",
				 " description [role] (new line) [new description] - Changes the description for an existing reaction role (NOTE: description must be on a new line)"
				],
	execute: async (bot, msg, args) => {
		var roles = await bot.stores.reactRoles.getAll(msg.guild.id);
		if(!roles || !roles.length) return 'No reaction roles available.';

		var embeds = await bot.utils.genEmbeds(bot, roles, async dat => {
			return {name: `${dat.raw.name} (${dat.emoji.includes(":") ? `<${dat.emoji}>` : dat.emoji})`, value: dat.description || "*(no description provided)*"}
		}, {
			title: "Server Reaction Roles",
			description: "All available roles for the server",
		}, 10);
		
		return embeds;
	},
	alias: ['rr', 'reactroles', 'reactrole', 'reactionrole'],
	subcommands: {},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.add = {
	help: ()=> "Adds a new reaction role.",
	usage: ()=> [" [role] [emoji] (new line) <description> - Creates a new reaction role config (NOTE: if emoji is custom, must be in the same server as the bot)"],
	execute: async (bot, msg, args)=> {
		var nargs = args.join(" ").split("\n");
		var arg1 = nargs[0].replace(/\s+$/,"").split(" ");
		var role = msg.guild.roles.find(r => r.id == arg1.slice(0, arg1.length-1).join(" ").replace(/[<@&>]/g, "") || r.name.toLowerCase() == arg1.slice(0, arg1.length-1).join(" ").toLowerCase());
		if(!role) return "Role not found.";
		var emoji = arg1.slice(-1)[0].replace(/[<>\s]/g,"");
		var description = nargs.slice(1).join("\n");

		try {
			await bot.stores.reactRoles.create(msg.guild.id, role.id, {emoji, description});
		} catch(e) {
			return "ERR: "+e;
		}

		return "React role created!";
	},
	alias: ['create', 'new'],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: ()=> "Removes a reaction role config.",
	usage: ()=> [" [role] - Removes config for the role (NOTE: roles that are deleted automatically have their config removed when posting or listing configs"],
	execute: async (bot, msg, args)=> {
		var role = msg.guild.roles.find(r => r.id == args.join(" ").replace(/[<@&>]/g, "") || r.name.toLowerCase() == args.join(" ").toLowerCase());
		if(!role) return "Role not found.";
		
		try {
			await bot.stores.reactRoles.delete(msg.guild.id, role.id);
		} catch(e) {
			return "ERR: "+e;
		}

		return "React role deleted!";
	},
	alias: ['delete'],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.bind = {
	help: ()=> "Binds a reaction role to a certain message.",
	usage: ()=> [" [role name] [channel] [messageID] - Binds a role to the message"],
	execute: async (bot, msg, args) => {
		if(!args[2]) return "This command requires at least 3 arguments.";
		var rl = args.slice(0, args.length - 2).join(" ").replace(/[<@&>]/g,"").toLowerCase();
		var role = msg.guild.roles.find(r => r.id == rl || r.name.toLowerCase() == rl);
		if(!role) return "Role not found.";
		role = await bot.stores.reactRoles.get(msg.guild.id, role.id);
		if(!role) return "Reaction role not found.";

		var channel = msg.guild.channels.find(ch => ch.id == args[args.length - 2].replace(/[<#>]/g,"") || ch.name == args[args.length - 2].toLowerCase());
		if(!channel) return "Channel not found.";
		var message = await bot.getMessage(channel.id, args[args.length-1]);
		if(!message) return "Invalid message.";

		var post = await bot.stores.reactPosts.get(message.guild.id, message.id);
		try {
			if(post) {
				if(post.roles.find(r => r.role_id == role.role_id)) {
					return "That role is already bound to that message.";
				} else if(post.roles.find(r => r.emoji == role.emoji)) {
					return "A role with that emoji is already bound to that message.";
				} else {
					post.raw_roles.push(role.id);
					await bot.stores.reactPosts.update(msg.guild.id, post.message_id, {roles: post.raw_roles});
				}
			} else {
				await bot.stores.reactPosts.create(msg.guild.id, message.channel.id, message.id, {roles: [role.id], page: 0});
			}

			await message.addReaction(role.emoji.replace(/^\:/, ""));
		} catch(e) {
			return "ERR: "+e;
		}

		return "React role bound!";
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.unbind = {
	help: ()=> "Uninds a reaction role from a certain message.",
	usage: ()=> [" [role name] [channel] [messageID] - Unbinds a role from the message"],
	execute: async (bot, msg, args) => {
		if(!args[2]) return "This command requires at least 3 arguments..";
		var rl = args.slice(0, args.length - 2).join(" ").replace(/[<@&>]/g,"").toLowerCase();
		var role = msg.guild.roles.find(r => r.id == rl || r.name.toLowerCase() == rl);
		if(!role) return "Role not found.";
		role = await bot.stores.reactRoles.get(msg.guild.id, role.id);
		if(!role) return "Reaction role not found.";

		var channel = msg.guild.channels.find(ch => ch.id == args[args.length - 2].replace(/[<#>]/g,"") || ch.name == args[args.length - 2].toLowerCase());
		if(!channel) return "Channel not found.";
		var message = await bot.getMessage(channel.id, args[args.length-1]);
		if(!message) return "Invalid message.";

		var post = await bot.stores.reactPosts.get(message.guild.id, message.id);
		try {
			if(post) {
				if(post.roles.find(r => r.role_id == role.role_id)) {
					post.raw_roles = post.raw_roles.filter(x => x != role.id);
					await bot.stores.reactPosts.update(msg.guild.id, post.message_id, {roles: post.raw_roles});
					
				} else {
					return "That role isn't bound to that message.";
				}
			} else {
				return "Nothing is bound to that post.";
			}

			await message.removeReaction(role.emoji.replace(/^\:/, ""));
		} catch(e) {
			return "ERR: "+e;
		}

		return "React role unbound!";
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.emoji = {
	help: ()=> "Changes emoji for a role.",
	usage: ()=> " [role] [emoji] - Changes emoji for the given role",
	execute: async (bot, msg, args)=> {
		var rl = args.slice(0, args.length - 1).join(" ").replace(/[<@&>]/g,"").toLowerCase();
		var role = msg.guild.roles.find(r => r.id == rl || r.name.toLowerCase() == rl);
		if(!role) return "Role not found.";
		role = await bot.stores.reactRoles.get(msg.guild.id, role.id);
		if(!role) return "React role not found.";

		var emoji = args[args.length - 1].replace(/[<>]/g,"");

		try {
			await bot.stores.reactRoles.update(msg.guild.id, role.role_id, {emoji});
		} catch(e) {
			return "ERR: "+e
		}

		return "Emoji changed!";
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.description = {
	help: ()=> "Changes description for a role.",
	usage: ()=> " [role] (new line) [description] - Changes description for the given role",
	execute: async (bot, msg, args)=> {
		var nargs = args.join(" ").split("\n");
		var rl = nargs[0].replace(/[<@&>]/g,"").toLowerCase();
		var role = msg.guild.roles.find(r => r.id == rl || r.name.toLowerCase() == rl);
		if(!role) return "Role not found.";
		role = await bot.stores.reactRoles.get(msg.guild.id, role.id);
		if(!role) return "React role not found.";

		var description = nargs.slice(1).join("\n");

		try {
			await bot.stores.reactRoles.update(msg.guild.id, role.role_id, {description});
		} catch(e) {
			return "ERR: "+e
		}

		return "Description changed!";
	},
	alias: ["describe", "desc"],
	permissions: ["manageRoles"],
	guildOnly: true
}