module.exports = {
	help: ()=> "Manage and assign role bundles.",
	usage: ()=> [" [hid] - Gets info on a bundle",
				 " create [bundle name] [1|0] - Runs a creation menu. The 1 or 0 defines self-assignability",
				 " add [hid] <@user @mention> - Adds bundle to yourself. Mod only: mention users to add bundle to them instead",
				 " remove [hid] <@user @mention> - Removes bundle from yourself. Mod only: mention users to remove bundle from them instead",
				 " name [hid] [new name] - Sets the name of a bundle (mod only)",
				 " description [hid] [new description] - Sets the description of a bundle (mod only)",
				 " delete [hid] - Deletes a given bundle (mod only)"],
	execute: async (bot, msg, args)=> {
		if(args[0]) {
			var bundle = await bot.stores.bundles.get(msg.guild.id, args[0].toLowerCase());
			if(!bundle) return "Bundle not found.";

			if(bundle.raw_roles.length !== bundle.roles.length) {
				if(!bundle.raw_roles[0]) {
					try {
						await bot.stores.bundles.delete(msg.guild.id, bundle.hid);
					} catch(e) {
						return "Error while deleting invalid bundle: "+e;
					}

					return "That bundle no longer has any valid roles in it, and has been deleted.";
				} else {
					try {
						await bot.store.bundles.update(msg.guild.id, bundle.hid, {roles: bundle.raw_roles.map(r => r.id)});
					} catch(e) {
						return "Error while removing invalid roles from bundle: "+e;
					}
				}
			}

			return {embed: {
				title: `${bundle.name} (${bundle.hid})`,
				fields: [
					{name: "Roles", value: bundle.raw_roles.map(r => r.name).join(", ") || "(no valid roles)"},
					{name: "Self Assignable?", value: bundle.assignable ? "Yes" : "No"}
				],
				color: b.assignable ? parseInt("55aa55", 16) : parseInt("5555aa", 16),
				footer: {
					text: `ID: ${b.hid}${bundle.raw_roles.length < bundle.roles.length ? " | Invalid roles have been removed" : ""}`
				}
			}}
		}

		var bundles = await bot.stores.bundles.getAll(msg.guild.id);
		if(!bundles || !bundles[0]) return "No bundles registered for this server.";

		var deleted = [];
		for(var i = 0; i < bundles.length; i++) {
			try {
				if(!bundles[i].raw_roles[0]) {
					await bot.stores.bundles.delete(msg.guild.id, bundles[i].hid);
					deleted.push(bundles[i].hid);
				} else if(bundles[i].raw_roles.length < bundles[i].roles.length) await bot.stores.bundles.update(msg.guild.id, bundles[i].hid, {roles: bundles[i].raw_roles.map(r => r.id)});
			} catch(e) {
				console.log(e);
			}
		}

		var embeds = bundles.map(b => {
			if(deleted.includes(b.hid)) {
				return {embed: {
					title: b.name,
					description: "This bundle was invalid and has been deleted"
				}}
			} else {
				return {embed: {
					title:`${b.name} (${b.hid})`,
					description: b.description || "(no description)",
					fields: [
						{name: "Roles", value: b.raw_roles.map(r => r.name).join(", ") || "(no valid roles)"},
						{name: "Self Assignable?", value: b.assignable ? "Yes" : "No"}
					],
					color: b.assignable ? parseInt("55aa55", 16) : parseInt("5555aa", 16),
					footer: {
						text: `ID: ${b.hid}`
					}
				}}
			}
		})

		if(embeds.length > 1) for(var i = 0; i < embeds.length; i++) embeds[i].embed.title += ` (page ${i+1}/${embeds.length})`;

		return embeds;
	},
	alias: ['bundles'],
	subcommands: {},
	guildOnly: true,
	module: "admin"
}

module.exports.subcommands.create = {
	help: ()=> "Runs a menu for creating bundles.",
	usage: ()=> [" [bundle name] [true/false | 1/0] - Creates a bundle with the given name and self-assignability"],
	execute: async (bot, msg, args)=> {
		var name = args.slice(0,-1).join(" ").toLowerCase();
		var assignable = args[args.length-1];
		var description;
		var code;
		var resp;
		if(!["true", "false", "1", "0"].includes(assignable)) return "Please provide a value for self-assignability.";

		await msg.channel.createMessage("Enter a description for this bundle. You have 5 minutes to do this. Type `skip` to skip");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 300000, maxMatches: 1});
		if(!resp || !resp[0]) return "ERR: timed out. Aborting.";
		if(resp[0].content.toLowerCase() !== "skip") description = resp[0].content;
		
		await msg.channel.createMessage("Enter role names for this bundle. They can be separated by new lines or commas. You have 3 minutes to do this");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 180000, maxMatches: 1});
		if(!resp || !resp[0]) return "ERR: timed out. Aborting.";

		var rolenames = resp[0].content.toLowerCase().replace(/[<@&>]/g, "").split(/(?:,\s*|\n)/);
		var roles = rolenames.map(r => msg.guild.roles.find(rl => [rl.id, rl.name.toLowerCase()].includes(r))).filter(x => x != undefined);
		if(!roles || !roles[0]) return "None of those roles are valid.";

		code = bot.utils.genCode(4, bot.strings.codestab);

		try {
			await bot.stores.bundles.create(msg.guild.id, code, {name, description, roles: roles.map(r => r.id), assignable});
		} catch(e) {
			return "ERR: "+e;
		}

		return {embed: {
			title: "Results",
			fields: [
				{name: "Indexed", value: roles.map(r => r.name).join("\n") || "(none)"},
				{name: "Not Indexed", value: rolenames.filter(r => !roles.find(rl => rl.name.toLowerCase() == r.toLowerCase())).map(x => `${x} - Role not found`).join("\n") || "(none)"}
			],
			color: parseInt("5555aa", 16)
		}}
	},
	alias: ["new", "make", "c"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.add = {
	help: ()=> "Adds a bundle to the target.",
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
					embeds.push({embed: {
						title: `Results for ${u.username}#${u.discriminator}`,
						description: "Couldn't find that user"},
						color: parseInt("aa5555", 16)
					});
					return null
				} else return member;
			}).filter(x => x!=null);
		} else targets = [msg.member];

		var bundle = await bot.stores.bundles.get(msg.guild.id, args[0].toLowerCase());
		if(!bundle) return "Bundle not found.";
		var roles = bundle.roles.map(r => msg.guild.roles.find(rl => rl.id == r)).filter(x => x != undefined);
		if(!roles || !roles[0]) {
			try {
				await bot.stores.bundles.delete(msg.guild.id, bundle.hid);
			} catch(e) {
				return "Error while deleting invalid bundle: "+e;
			}

			return "That bundle no longer has valid roles, and has been deleted.";
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
				],
				color: parseInt("55aa55", 16)
			}})
		}

		return embeds;
	},
	guildOnly: true,
	alias: ["a", "+"]
}

module.exports.subcommands.remove = {
	help: ()=> "Removes a bundle from the target.",
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
					embeds.push({embed: {
						title: `Results for ${u.username}#${u.discriminator}`,
						description: "Couldn't find that user",
						color: parseInt("aa5555", 16)
					}});
					return null
				} else return member;
			}).filter(x => x!=null);
		} else targets = [msg.member];

		var bundle = await bot.stores.bundles.get(msg.guild.id, args[0].toLowerCase());
		if(!bundle) return "Bundle not found.";
		var roles = bundle.roles.map(r => msg.guild.roles.find(rl => rl.id == r)).filter(x => x != undefined);
		if(!roles || !roles[0]) {
			try {
				await bot.stores.bundles.delete(msg.guild.id, bundle.hid);
			} catch(e) {
				return "Error while deleting invalid bundle: "+e;
			}

			return "That bundle no longer has valid roles, and has been deleted.";
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
				],
				color: parseInt("55aa55", 16)
			}})
		}

		return embeds;
	},
	guildOnly: true,
	alias: ["r", "rmv", "-"]
}

module.exports.subcommands.name = {
	help: ()=> "Set a bundle's name.",
	usage: ()=> [" [hid] [new name] - Sets the given bundle's name"],
	execute: async (bot, msg, args) => {
		var bundle = await bot.stores.bundles.get(msg.guild.id, args[0].toLowerCase());
		if(!bundle) return "Bundle not found.";

		try {
			await bot.stores.bundles.update(msg.guild.id, bundle.hid, {name: args.slice(1).join(" ")});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Bundle updated!";
	},
	alias: ["n", "rename"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.description = {
	help: ()=> "Set a bundle's description.",
	usage: ()=> [" [hid] [new description] - Sets the given bundle's description"],
	execute: async (bot, msg, args) => {
		var bundle = await bot.stores.bundles.get(msg.guild.id, args[0].toLowerCase());
		if(!bundle) return "Bundle not found.";

		try {
			await bot.stores.bundles.update(msg.guild.id, bundle.hid, {description: args.slice(1).join(" ")});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Bundle updated!";
	},
	alias: ["d", "desc", "describe"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes a bundle.",
	usage: ()=> [" [hid] - Deletes given bundle"],
	execute: async (bot, msg, args)=> {
		var bundle = await bot.stores.bundles.get(msg.guild.id, args[0].toLowerCase());
		if(!bundle) return "Bundle not found.";

		try {
			await bot.stores.bundles.delete(msg.guild.id, bundle.hid);
		} catch(e) {
			return "ERR: "+e;
		}

		return "Bundle deleted!";
	},
	permissions: ["manageRoles"],
	guildOnly: true
}