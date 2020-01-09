module.exports = {
	help: ()=> "Manage and assign role bundles",
	usage: ()=> [" create [bundle name] - Runs a creation menu",
				 " [hid] - Gets info on a bundle",
				 " add [hid] <@user @mention> - Adds bundle to yourself. Mod only: mention users to add bundle to them instead",
				 " remove [hid] <@user @mention> - Removes bundle from yourself. Mod only: mention users to remove bundle from them instead",
				 " name [hid] [new name] - Sets the name of a bundle (mod only)",
				 " description [hid] [new description] - Sets the description of a bundle (mod only)",
				 " delete [hid] - Deletes a given bundle (mod only)"],
	execute: async (bot, msg, args)=> {
		if(args[0]) {
			var bundle = await bot.utils.getBundle(bot, msg.guild.id, args[0].toLowerCase());
			if(!bundle) return msg.channel.createMessage("Bundle not found");
			var roles = bundle.roles.map(r => msg.guild.roles.find(rl => rl.id == r)).filter(x => x != undefined);

			msg.channel.createMessage({embed: {
				title: bundle.name,
				fields: [
					{name: "Roles", value: roles.map(r => r.name).join(", ") || "(no valid roles)"},
					{name: "Self Assignable?", value: bundle.assignable ? "Yes" : "No"}
				],
				color: b.assignable ? parseInt("55aa55", 16) : parseInt("5555aa", 16),
				footer: {
					text: `ID: ${b.hid}`
				}
			}})
			
			if(roles.length !== bundle.roles.length) {
				if(!roles[0]) {
					var scc = await bot.utils.deleteBundle(bot, msg.guild.id, bundle.hid)
					if(scc) msg.channel.createMessage("That bundle no longer has any valid roles in it, and has been deleted");
					else msg.channel.createMessage("That bundle no longer has any valid roles in it, but could not be deleted");
				} else {
					var scc = await bot.utils.updateBundle(bot, msg.guild.id, bundle.hid, {roles: roles.map(r => r.id)})
					if(scc) msg.channel.creatMessage("Invalid roles removed from bundle");
					else msg.channel.createMessage("Something went wrong while removing invalid roles from this bundle");
				}
			}
			return;
		}

		var bundles = await bot.utils.getBundles(bot, msg.guild.id);
		if(!bundles || !bundles[0]) return msg.channel.createMessage("No bundles registered for this server");

		var toupdate = [];
		for(var i = 0; i < bundles.length; i++) {
			bundles[i].realRoles = bundles[i].roles.map(r => msg.guild.roles.find(rl => rl.id == r)).filter(x => x != undefined) || [];
			if(!bundles[i].realRoles[0]) toupdate.push({bundle: bundles[i], delete: true});
			else if(bundles[i].realRoles.length !== bundles[i].roles.length) tupdate.push({bundle: bundles[i], delete: false});
		}

		var embeds = bundles.map(b => {
			return {embed: {
				title: b.name,
				description: b.description || "(no description)",
				fields: [
					{name: "Roles", value: b.realRoles.map(r => r.name).join(", ") || "(no valid roles)"},
					{name: "Self Assignable?", value: b.assignable ? "Yes" : "No"}
				],
				color: b.assignable ? parseInt("55aa55", 16) : parseInt("5555aa", 16),
				footer: {
					text: `ID: ${b.hid}`
				}
			}}
		})

		var message = await msg.channel.createMessage(embeds[0])
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

		if(toupdate.length > 0) {
			var err;
			for(var i = 0; i < toupdate.length; i++) {
				var scc;
				if(toupdate[i].delete) scc = await bot.utils.deleteBundle(bot, msg.guild.id, toupdate[i].bundle.hid);
				else scc = await bot.utils.updateBundle(bot, msg.guild.id, toupdate[i].bundle.hid, {roles: toupdate[i].bundle.realRoles.map(r => r.id)});

				if(!scc) err = true;
			}
			if(err) msg.channel.createMessage("Some bundles with invalid roles could not be updated/deleted");
			else msg.channel.createMessage("Invalid roles have been successfully removed from applicable bundles! Bundles with no valid roles have also been deleted");
		}
	},
	subcommands: {},
	guildOnly: true,
	module: "admin"
}

module.exports.subcommands.add = {
	help: ()=> "Adds a bundle to the target",
	usage: ()=> [" [hid] - Adds given bundle, if possible",
				 " [hid] [@user @mentions] - Adds bundle to the given users (mods only)"],
	desc: ()=> "Only up to 5 users can have a bundle added at once using this command",
	execute: async (bot, msg, args)=>{
		var embeds = [];
		var targets;
		if(msg.mentions[0]) {
			targets = msg.mentions.map(u => {
				var member = msg.guild.members.find(m => m.id == u.id);
				if(!member) {
					embeds.push({embed: {title: `Results for ${u.username}#${u.discriminator}`, description: "Couldn't find that user"}});
					return null
				} else return member;
			}).filter(x => x!=null);
		} else targets = [msg.member];

		var bundle = await bot.utils.getBundle(bot, msg.guild.id, args[0].toLowerCase());
		if(!bundle) return msg.channel.createMessage("Bundle not found");
		var roles = bundle.roles.map(r => msg.guild.roles.find(rl => rl.id == r)).filter(x => x != undefined);
		if(!roles || !roles[0]) {
			var scc = await bot.utils.deleteBundle(bot, msg.guild.id, bundle.hid);
			if(scc) msg.channel.createMessage("That bundle no longer has any valid roles in it, and has been deleted");
			else msg.channel.createMessage("That bundle no longer has any valid roles in it, but could not be deleted");
			return;
		}

		for(var i = 0; i < targets.length; i++) {
			var results = [];
			for(var j = 0; j < roles.length; j++) {
				if(targets[i].roles.includes(roles[i].id)) {
					results.push({name: roles[i].name, reason: "Member already has that role"});
					continue;
				}

				try {
					await targets[i].addRole(roles[i].id);
				} catch(e) {
					console.log(e);
					results.push({name: roles[i].name, reason: "Couldn't add to member"});
					continue;
				}
				results.push({name: roles[i].name})
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
	help: ()=> "Removes a bundle to the target",
	usage: ()=> [" [hid] - Removes given bundle, if possible",
				 " [hid] [@user @mentions] - Removes bundle from the given users (mods only)"],
	desc: ()=> "Only up to 5 users can have a bundle removed at once using this command",
	execute: async (bot, msg, args)=>{
		var embeds = [];
		var targets;
		if(msg.mentions[0]) {
			targets = msg.mentions.map(u => {
				var member = msg.guild.members.find(m => m.id == u.id);
				if(!member) {
					embeds.push({embed: {title: `Results for ${u.username}#${u.discriminator}`, description: "Couldn't find that user"}});
					return null
				} else return member;
			}).filter(x => x!=null);
		} else targets = [msg.member];

		var bundle = await bot.utils.getBundle(bot, msg.guild.id, args[0].toLowerCase());
		if(!bundle) return msg.channel.createMessage("Bundle not found");
		var roles = bundle.roles.map(r => msg.guild.roles.find(rl => rl.id == r)).filter(x => x != undefined);
		if(!roles || !roles[0]) {
			var scc = await bot.utils.deleteBundle(bot, msg.guild.id, bundle.hid);
			if(scc) msg.channel.createMessage("That bundle no longer has any valid roles in it, and has been deleted");
			else msg.channel.createMessage("That bundle no longer has any valid roles in it, but could not be deleted");
			return;
		}

		for(var i = 0; i < targets.length; i++) {
			var results = [];
			for(var j = 0; j < roles.length; j++) {
				if(!targets[i].roles.includes(roles[i].id)) {
					results.push({name: roles[i].name, reason: "Member already doesn't have that role"});
					continue;
				}

				try {
					await targets[i].removeRole(roles[i].id);
				} catch(e) {
					console.log(e);
					results.push({name: roles[i].name, reason: "Couldn't remove from member"});
					continue;
				}
				results.push({name: roles[i].name})
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

module.exports.subcommands.create = {
	help: ()=> "Runs a menu for creating bundles",
	usage: ()=> [" [bundle name] [true/false | 1/0] - Creates a bundle with the given name and self-assignability"],
	execute: async (bot, msg, args)=> {
		var name = args.slice(0,-1).join(" ").toLowerCase();
		var assignable = args[args.length-1];
		var description;
		var code;
		var response;
		if(!["true", "false", "1", "0"].includes(assignable)) return msg.channel.createMessage("Please provide a value for self-assignability.");

		await msg.channel.createMessage("Enter a description for this bundle. You have 5 minutes to do this. Type `skip` to skip");
		response = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 300000, maxMatches: 1});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: Timed out. Aborting");
		if(resp[0].content.toLowerCase() !== "skip") description = resp[0].content;
		
		await msg.channel.createMessage("Enter role names for this bundle. They can be separated by new lines or commas. You have 3 minutes to do this");
		response = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 180000, maxMatches: 1});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: Timed out. Aborting");

		var rolenames = resp[0].content.split(/(?:,\s*|\n)/);
		var roles = rolenames.map(r => msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase())).filter(x => x != undefined);
		if(!roles || !roles[0]) return msg.channel.createMessage("None of those roles are valid");

		code = bot.utils.genCode(4, bot.strings.codestab);

		var scc = await bot.utils.addBundle(bot, msg.guild.id, code, name, description, roles.map(r => r.id), assignable);
		if(!scc) return msg.channel.createMessage("Something went wrong");

		msg.channel.createMessage({embed: {
			title: "Results",
			fields: [
				{name: "Indexed", value: roles.map(r => r.name).join("\n")},
				{name: "Not Indexed", value: rolenames.filter(r => !roles.find(rl => rl.name.toLowerCase() == r.name.toLowerCase())).map(x => `${x} - Role not found`).join("\n")}
			],
			color: parseInt("5555aa", 16)
		}})
	},
	alias: ["new", "make", "c"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.name = {
	help: ()=> "Set a bundle's name",
	usage: ()=> [" [hid] [new name] - Sets the given bundle's name"],
	execute: async (bot, msg, args) => {
		var bundle = await bot.utils.getBundle(bot, msg.guild.id, args[0].toLowerCase());
		if(!bundle) return msg.channel.createMessage("Bundle not found");

		var scc = await bot.utils.updateBundle(bot, msg.guild.id, bundle.id, {name: args.slice(1).join(" ")});
		if(scc) msg.channel.createMessage("Bundle updated!");
		else msg.channel.createMessage("Something went wrong");
	},
	alias: ["n", "rename"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.description = {
	help: ()=> "Set a bundle's description",
	usage: ()=> [" [hid] [new description] - Sets the given bundle's description"],
	execute: async (bot, msg, args) => {
		var bundle = await bot.utils.getBundle(bot, msg.guild.id, args[0].toLowerCase());
		if(!bundle) return msg.channel.createMessage("Bundle not found");

		var scc = await bot.utils.updateBundle(bot, msg.guild.id, bundle.id, {description: args.slice(1).join(" ")});
		if(scc) msg.channel.createMessage("Bundle updated!");
		else msg.channel.createMessage("Something went wrong");
	},
	alias: ["d", "desc", "describe"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes a bundle",
	usage: ()=> [" [hid] - Deletes given bundle"],
	execute: async (bot, msg, args)=> {
		var bundle = await bot.utils.getBundle(bot, msg.guild.id, args[0].toLowerCase());
		if(!bundle) return msg.channel.createMessage("Bundle does not exist");

		var scc = await bot.utils.deleteBundle(bot, msg.guild.id, bundle.hid);
		if(scc) msg.channel.createMessage("Bundle deleted!");
		else msg.channel.createMessage("Something went wrong");
	},
	permissions: ["manageRoles"],
	guildOnly: true
}