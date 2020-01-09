module.exports = {
	help: ()=> "Manage server self roles",
	usage: ()=> [" - List currently indexed self roles",
				 " [role] - Gets info on a role",
				 " add [comma, separated, role names] <@user @mentions> - Adds role(s) to yourself. Mod only: mention users to add roles to them instead",
				 " remove [comma, separated, role names] <@user @mentions> - Remmoves role(s) from yourself. Mod only: mention users to remove roles from them instead",
				 " index [role] [1/0 | true/false | remove] (new line) <description> - Indexes new self role, either self-roleable (1) or mod-roleable (0) (mod only)",
				 " description [role] [new description] - Sets the description of a self role (mod only)",
				 " create [role name] - Creates a new role with the given name (mod only)",
				 " name [role] (new line) [new name] - Sets the name of a role (mod only)",
				 " color [role] [new color] - Sets the color of a role (mod only)",
				 " delete [role] - Deletes a role (mod only)"],
	execute: async (bot, msg, args)=>{
		if(args[0]) {
			var role = msg.guild.roles.find(r => [r.name.toLowerCase(), r.id].includes(args.join(" ").toLowerCase()));
			if(!role) return msg.channel.createMessage("Role not found");
			var selfrole = await bot.utils.getSelfRole(bot, msg.guild.id, role.id);
			var assignable;
			if(selfrole) assignable = selfrole.assignable ? "Yes" : "No";
			else assignable = "Not indexed";
			var perms = role.permissions.json;

			return msg.channel.createMessage({embed: {
				title: "Role Info",
				fields: [
					{name: "Name", value: role.name},
					{name: "ID", value: role.id},
					{name: "Color", value: role.color ? role.color.toString(16) : "(no color)"},
					{name: "Self Assignable?", value: assignable},
					{name: "Pingable?", value: role.mentionable ? "Yes" : "No"},
					{name: "Hoisted?", value: role.hoist ? "Yes" : "No"},
					{name: "Allowed Permissions", value: Object.keys(perms).filter(x => perms[x]).join(", ") || "(none)"},
					{name: "Disallowed Permissions", value: bot.strings.permission_nodes.filter(x => !perms[x]).join(", ") || "(none)"}
				],
				color: role.color
			}});
		}

		var roles = await bot.utils.getSelfRoles(bot, msg.guild.id);
		if(!roles || !roles[0]) return msg.channel.createMessage("No roles registered for this server");
		var todelete = [];
		for(var i = 0; i < roles.length; i++) {
			var role = msg.guild.roles.find(r => r.id == roles[i].role_id);
			if(!role) {
				todelete.push(roles[i].role_id);
				roles[i] = null;
			} else roles[i].role = role;
		}
		roles = roles.filter(x => x != null);

		var embeds = [];
		if(roles.filter(x => x.assignable).length > 0) {
			var assignable = await bot.utils.genEmbeds(bot, roles.filter(x => x.assignable), r => {
				return {name: r.role.name, value: r.description || "(no description)"}
			}, {
				title: "Assignable Roles",
				description: "Roles that can be self assigned",
				color: parseInt("55aa55", 16)
			}, 10);
			console.log(assignable);
			embeds = embeds.concat(assignable);
		}
		if(roles.filter(x => !x.assignable).length > 0) {
			var modonly = await bot.utils.genEmbeds(bot, roles.filter(x => !x.assignable), r => {
				return {name: r.role.name, value: r.description || "(no description)"}
			}, {
				title: "Mod-Only Roles",
				description: "Roles that can only be assigned by mods",
				color: parseInt("5555aa", 16)
			}, 10);
			embeds = embeds.concat(modonly);
		}

		var message = await msg.channel.createMessage(embeds[0])
		if(embeds.length > 1) {
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				data: embeds,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					try {
						message.removeReactions();
					} catch(e) {
						console.log(e);
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
		}
		

		if(todelete[0]) {
			var scc = await bot.utils.deleteSelfRoles(bot, msg.guild.id, todelete);
			if(!scc) msg.channel.createMessage("Something went wrong while removing roles that no longer exist")
		}
	},
	module: "utility",
	subcommands: {},
	guildOnly: true,
	alias: ["roles", "roll"]
}

module.exports.subcommands.add = {
	help: ()=> "Adds (a) selfrole(s)",
	usage: ()=> [" [comma, separated, role names] - Adds given roles, if applicable",
				 " [role names] [@user @mentions] - Adds roles to the given users (mods only)"],
	desc: ()=> "Only up to 5 users can have roles added at once using this command",
	execute: async (bot, msg, args)=>{
		var embeds = [];
		var names;
		var targets;
		if(msg.mentions.length > 0){
			if(!msg.member.permission.has("manageRoles")) return msg.channel.createMessage("You don't have permission to add roles to other users");
			if(msg.mentions.length > 5) return msg.channel.createMessage("This command can only be used to add roles to up to 5 members at once");

			var l = msg.mentions.length;
			targets = msg.mentions.map(u => {
				var member = msg.guild.members.find(m => m.id == u.id);
				if(!member) {
					embeds.push({embed: {title: `Results for ${target[i].id}`, description: "Couldn't find that user"}});
					return null
				} else return member;
			}).filter(x => x!=null);
			names = args.slice(0,-l).join(" ").split(/,\s*/);
		} else {
			names = args.join(" ").toLowerCase().split(/,\s*/g);
			targets = [msg.member];
		}

		for(var i = 0; i < targets.length; i++) {
			var results = [];
			for(var j = 0; j < names.length; j++) {
				var role = msg.guild.roles.find(rl => rl.name.toLowerCase() == names[j].toLowerCase());
				if(!role) {
					results.push({name: names[j], reason: "Role not found"});
					continue;
				}
				role = await bot.utils.getSelfRole(bot, msg.guild.id, role.id);
				if(!role) {
					results.push({name: names[j], reason: "Self role not found"});
					continue;
				} else if(!role.assignable && !msg.member.permission.has("manageRoles")) {
					results.push({name: names[j], reason: "Self role not assignable by members"});
					continue;
				}
				if(targets[i].roles.includes(role.role_id)) {
					results.push({name: names[j], reason: "Member already has that role"});
					continue;
				}

				try {
					await targets[i].addRole(role.role_id);
				} catch(e) {
					console.log(e);
					results.push({name: names[j], reason: "Couldn't add to member"});
					continue;
				}
				results.push({name: names[j]})
			}

			embeds.push({embed: {
				title: `Results for ${targets[i].username}#${targets[i].discriminator}`,
				fields: [
					{name: "Added", value: results.filter(x => !x.reason).map(x => x.name).join("\n") || "None"},
					{name: "Not Added", value: results.filter(x => x.reason != undefined).map(x => `${x.name} - ${x.reason}`).join("\n") || "None"}
				]
			}})
		}

		var message = await msg.channel.createMessage(embeds[0]);

		if(embeds.length > 1) {
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

			["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
		}
	},
	guildOnly: true,
	alias: ["a", "+"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes (a) selfrole(s)",
	usage: ()=> [" [comma, separated, role names] - Removes given roles, if applicable",
				 " [role names] [@user @mentions] - Removes roles from the given users (mods only)"],
	desc: ()=> "Only up to 5 users can have roles removed at once using this command",
	execute: async (bot, msg, args)=>{
		var embeds = [];
		var names;
		var targets;
		if(msg.mentions.length > 0){
			if(!msg.member.permission.has("manageRoles")) return msg.channel.createMessage("You don't have permission to remove roles from other users");
			if(msg.mentions.length > 5) return msg.channel.createMessage("This command can only be used to remove roles from up to 5 members at once");

			var l = msg.mentions.length;
			targets = msg.mentions.map(u => {
				var member = msg.guild.members.find(m => m.id == u.id);
				if(!member) {
					embeds.push({embed: {title: `Results for ${u.username}#${u.discriminator}`, description: "Couldn't find that user"}});
					return null
				} else return member;
			}).filter(x => x!=null);
			names = args.slice(0,-l).join(" ").split(/,\s*/);
		} else {
			names = args.join(" ").toLowerCase().split(/,\s*/g);
			targets = [msg.member];
		}

		for(var i = 0; i < targets.length; i++) {
			var results = [];
			for(var j = 0; j < names.length; j++) {
				var role = msg.guild.roles.find(rl => rl.name.toLowerCase() == names[j].toLowerCase());
				if(!role) {
					results.push({name: names[j], reason: "Role not found"});
					continue;
				}
				role = await bot.utils.getSelfRole(bot, msg.guild.id, role.id);
				if(!role) {
					results.push({name: names[j], reason: "Self role not found"});
					continue;
				} else if(!role.assignable && !msg.member.permission.has("manageRoles")) {
					results.push({name: names[j], reason: "Self role not assignable by members"});
					continue;
				}
				if(!targets[i].roles.includes(role.role_id)) {
					results.push({name: names[j], reason: "Member doesn't have that role"});
					continue;
				}

				try {
					await targets[i].removeRole(role.role_id);
				} catch(e) {
					console.log(e);
					results.push({name: names[j], reason: "Couldn't remove from member"});
					continue;
				}
				results.push({name: names[j]})
			}

			embeds.push({embed: {
				title: `Results for ${targets[i].username}#${targets[i].discriminator}`,
				fields: [
					{name: "Removed", value: results.filter(x => !x.reason).map(x => x.name).join("\n") || "None"},
					{name: "Not Removed", value: results.filter(x => x.reason != undefined).map(x => `${x.name} - ${x.reason}`).join("\n") || "None"}
				]
			}})
		}

		var message = await msg.channel.createMessage(embeds[0]);

		if(embeds.length > 1) {
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

			["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
		}
	},
	guildOnly: true,
	alias: ["r", "rmv", "-"]
}

module.exports.subcommands.description = {
	help: ()=> "Set a self role's description",
	usage: ()=> [" [role name] (new line) [description] - Sets the given self role's description"],
	execute: async (bot, msg, args) => {
		var nargs = args.join(" ").split("\n");
		var role = msg.guild.roles.find(r => r.name.toLowerCase() == nargs[0].toLowerCase());
		if(!role) return msg.channel.createMessage("Role not found");
		var selfrole = await bot.utils.getSelfRole(bot, msg.guild.id, role.id);
		if(!selfrole) return msg.channel.createMessage("Self role not found");

		var scc = await bot.utils.updateSelfRole(bot, msg.guild.id, role.id, {description: nargs.slice(1).join("\n")});
		if(scc) msg.channel.createMessage("Role updated!");
		else msg.channel.createMessage("Something went wrong");
	},
	alias: ["desc"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.index = {
	help: ()=> "Index new selfroles.",
	usage: ()=> [" [role name] [1/0 | true/false | remove] (new line) <description> - Indexes new role, either self-roleable (1) or mod-roleable (0). NOTE: The description is optional, but needs to be on a new line"],
	desc: ()=> "Use the `remove` keyword to remove a self role entirely",
	execute: async (bot, msg, args)=>{
		if(!args[1]) return msg.channel.createMessage("Please provide a role name and a value for self-assignability");
		var nargs = args.join(" ").split("\n");
		var line1 = nargs[0].split(" ");
		var name = line1.slice(0,-1).join(" ").toLowerCase();
		var assignable = line1[line1.length-1];
		var description = nargs.slice(1).join("\n");
		if(!["0", "1", "false", "true", "remove"].includes(assignable)) return msg.channel.createMessage("Please provide a value for self-assignability");

		var role = msg.guild.roles.find(r => r.name.toLowerCase() == name);
		if(!role) return msg.channel.createMessage("Couldn't find that role");

		var selfrole = await bot.utils.getSelfRole(bot, msg.guild.id, role.id);
		var scc;
		if(selfrole) {
			if(assignable == "remove") {
				scc = await bot.utils.deleteSelfRole(bot, msg.guild.id, role.id);
				if(scc) msg.channel.createMessage("Self role deleted");
				else msg.channel.createMessage("Something went wrong");
			} else {
				scc = await bot.utils.updateSelfRole(bot, msg.guild.id, role.id, {assignable: assignable, description: description || selfrole.description});
				if(scc) msg.channel.createMessage("Self role updated!");
				else msg.channel.createMessage("Something went wrong");
			}
			
		} else {
			if(assignable == "remove") return msg.channel.createMessage("That role isn't registered as a self role");
			scc = await bot.utils.addSelfRole(bot, msg.guild.id, role.id, assignable, description);
			if(scc) msg.channel.createMessage("Self role indexed");
			else msg.channel.createMessage("Something went wrong");
		}
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.create = {
	help: ()=> "Creates a role",
	usage: ()=> [" [role name] - Creates a new role with the given name (mod only)"],
	execute: async (bot, msg, args)=> {
		var name = args.join(" ");
		try {
			await msg.guild.createRole({name: name});
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Something went wrong");
		}
		
		msg.channel.createMessage("Role created! Use `hh!role edit` to edit the role");
	},
	alias: ["new", "+", "make"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.name = {
	help: ()=> "Sets a role's name",
	usage: ()=> " [role] (new line) [new name] - Sets the role's name",
	execute: async (bot, msg, args) => {
		var nargs = args.join(" ").split("\n");
		var role = msg.guild.roles.find(r => r.name.toLowerCase() == nargs[0]);
		if(!role) return msg.channel.createMessage("Role not found");

		try {
			role.edit({name: nargs[1]});
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Something went wrong");
		}

		msg.channel.createMessage("Role edited!");
	},
	alias: ["rename"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.color = {
	help: ()=> "Sets a role's color",
	usage: ()=> " [role] (new line) [new color] - Sets the role's color",
	execute: async (bot, msg, args) => {
		var nargs = args.join(" ").split("\n");
		var role = msg.guild.roles.find(r => r.name.toLowerCase() == nargs[0]);
		if(!role) return msg.channel.createMessage("Role not found");
		var color = bot.tc(nargs[1].split(" ").join(""));
		if(!color.isValid()) return msg.channel.createMessage("That isn't a valid color");

		try {
			role.edit({color: parseInt(color.toHex(), 16)});
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Something went wrong");
		}

		msg.channel.createMessage("Role edited!");
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes a role",
	usage: ()=> [" [role name/ID] - Deletes given role"],
	execute: async (bot, msg, args)=> {
		var role = msg.guild.roles.find(r => [r.name.toLowerCase(), r.id].includes(args.join(" ").toLowerCase()));
		if(!role) return msg.channel.createMessage("Role not found");

		try {
			await role.delete("Deleted through command");
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("Something went wrong")
		}

		msg.channel.createMessage("Role deleted!");
	},
	permissions: ["manageRoles"],
	guildOnly: true
}