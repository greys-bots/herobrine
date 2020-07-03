module.exports = {
	help: ()=> "View and manage server welcoming protocol",
	usage: ()=> [" - Views current welcome config",
				 " [users] - Welcomes users",
				 " channel <channel> - [Re]sets welcome channel",
				 " autoroles [comma, separated, role names] - Default roles to add to members",
				 " welcroles [comma, separated, role names] - Roles to add when welcoming members",
				 " message [message goes here] - Sets welcome message",
				 " enable - Enables welcome protocol",
				 " disable - Disables welcome protocol"],
	execute: async (bot, msg, args)=>{
		var cfg = await bot.stores.welcomeConfigs.get(msg.guild.id);
		if(!cfg) return "There is no welcome config for this server.";
		if(!args[0]) {
			var preroles;
			var postroles;
			var channel;
			if(cfg.preroles) preroles = cfg.preroles.map(r => msg.guild.roles.find(rl => rl.id == r)).filter(x => x!=undefined);
			if(cfg.postroles) postroles = cfg.postroles.map(r => msg.guild.roles.find(rl => rl.id == r)).filter(x => x!=undefined);
			if(cfg.channel) channel = msg.guild.channels.find(c => c.id == cfg.channel) || "(invalid)";

			if(preroles.length < cfg.preroles.length || postroles.length < cfg.postroles.length) {
				cfg.preroles = cfg.preroles.filter(x => preroles.find(r => r.id == x));
				cfg.postroles = cfg.postroles.filter(x => postroles.find(r => r.id == x));
			}
			if(channel == "(invalid)") cfg.channel = "";

			var message = "Any invalid data has been removed from the config";
			try {
				await bot.stores.welcomeConfigs.update(msg.guild.id, {preroles: cfg.preroles, postroles: cfg.postroles, channel: cfg.channel});
			} catch(e) {
				message = "Invalid data could not be removed from the config";
			}

			return {content: message, embed: {
				title: "Welcome Config",
				description: "Pre-roles are roles set when a user joins\nPost-roles are roles given when a user is welcomed using `hh!welcome [user]`",
				fields: [
					{name: "Pre/Auto-Roles", value: preroles && preroles[0] ? preroles.map(r => r.mention).join("\n") : "(not set)"},
					{name: "Post-/Given Roles", value: postroles && postroles[0] ? postroles.map(r => r.mention).join("\n") : "(not set)"},
					{name: "Channel", value: channel ? channel.mention : "(not set)"},
					{name: "Message", value: cfg.message ? cfg.message : "(not set)"},
					{name: "Enabled?", value: cfg.enabled ? "Yes" : "No"}
				]
			}}
		}
		
		var toRemove = [];
		var results = [];
		var rls = cfg.postroles;
		for(var i = 0; i < args.length; i++) {
			var member = msg.guild.members.find(m => m.id == args[i].replace(/[<@!>]/g,""));
			if(!member) {
				results[i] = {embed: {
					title: args[i],
					description: "Member not found",
					fields: [
						{name: "Added", value: "N/A"},
						{name: "Not Added", value: "N/A"}
					]
				}};
				continue;
			}

			results[i] = {embed: {
				title: `${member.username}#${member.discriminator} (${member.id})`,
				fields: [
					{name: "Added", value: []},
					{name: "Not Added", value: []}
				]
			}};

			for(var r of rls) {
				var role = msg.guild.roles.find(rl => rl.id == r);
				if(role) {
					try {
						await member.addRole(r);
					} catch(e) {
						console.log(e);
						results[i].embed.fields[1].value.push(role.name + " - Missing permissions");
						continue;
					}
					results[i].embed.fields[0].value.push(role.name);
				} else {
					results[i].embed.fields[1].value.push(role.name + " - Role not found");
				}
			}

			results[i].embed.fields.forEach(f => {
				f.value[0] ? f.value = f.value.join("\n") : f.value = "(none)";
				return f;
			})
			try {
				var channel = await bot.getDMChannel(member.id);
				channel.createMessage(`Congrats! You've officially been welcomed in ${msg.guild.name}!`);
			} catch(e) {
				console.log(e);
			}
		}

		if(toRemove.length > 0) {
			try {
				await bot.stores.welcomeConfigs.update(msg.guild.id, {postroles: cfg.postroles.filter(x => !toRemove.includes(x))});
			} catch(e) {
				for(var result in results) result.embed.footer = "Invalid roles could not be removed from the database"
			}
		}

		return results;
	},
	subcommands: {},
	guildOnly: true,
	alias: ["welc"],
	module: "admin",
	permisions: ["manageGuild"]
}

module.exports.subcommands.channel = {
	help: ()=> "[Re]set welcome channel",
	usage: ()=> [" <channel> - Sets welcome channel. Resets it if no channel given"],
	desc: ()=> "Channel can be a #mention, ID, or channel-name",
	execute: async (bot, msg, args)=>{
		var cfg = await bot.stores.welcomeConfigs.get(msg.guild.id);
		var channel;
		if(cfg && cfg.channel) channel = msg.guild.channels.find(c => c.id == cfg.channel);
		else channel = undefined;
		if(!args[0]) {
			if(channel) {
				var message = await msg.channel.createMessage(`Current channel: ${channel.mention}.\nWould you like to reset it?`);
				if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
					user: msg.author.id,
					index: 0,
					timeout: setTimeout(()=> {
						if(!bot.menus[message.id]) return;
						if(message.channel.guild) {
							try {
								message.removeReactions();
							} catch(e) {
								console.log(e);
							}
						}
						delete bot.menus[message.id];
					}, 900000),
					execute: async function(bot, m, e) {
						switch(e.name) {
							case "✅":
								try {
									await bot.stores.welcomeConfigs.update(m.guild.id, {channel: null});
								} catch(e) {
									return await m.channel.createMessage("ERR: "+e);
								}

								await m.channel.createMessage("Channel reset!");
								break;
							case "❌":
								await m.channel.createMessage("Action cancelled");
								break;
						}
					}
				};
				["✅","❌"].forEach(r => message.addReaction(r));
				return;
			} else if(!channel && (cfg && cfg.welcome && cfg.welcome.channel)) {
				try {
					await bot.stores.welcomeConfigs.update(msg.guild.id, {channel: null});
				} catch(e) {
					return "Error while resetting invalid channel: "+e;
				}
				return "The current set channel is invalid and has been reset.";
			} else return "No welcome channel has been set.";
		}

		channel = msg.guild.channels.find(c => c.id == args[0].replace(/[<#>]/g,"") || c.name == args[0].toLowerCase());
		if(!channel) return "Channel not found";

		try {
			await bot.stores.welcomeConfigs.update(msg.guild.id, {channel: channel.id});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Channel updated!";
	},
	guildOnly: true,
	alias: ["chan"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.message = {
	help: ()=> "[Re]set welcome message",
	usage: ()=> [" <new message> - Sets welcome message. Resets if no message is given"],
	desc: ()=> ["**Defined Vars**",
				"$MEMBER.MENTION = mentions the member who joined",
				"$MEMBER.NAME = gives the member's name and discriminator",
				"$MEMBER.ID = gives the member's ID",
				"$GUILD.NAME = gives the guild's name",
				"*Vars should be in all caps*"].join("\n"),
	execute: async (bot, msg, args)=>{
		var cfg = await bot.stores.welcomeConfigs.get(msg.guild.id);
		if(!args[0]) {
			if(cfg && cfg.message) {
				var message = await msg.channel.createMessage(`Current message: ${cfg.message}.\nWould you like to reset it?`);
				if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
					user: msg.author.id,
					index: 0,
					timeout: setTimeout(()=> {
						if(!bot.menus[message.id]) return;
						if(message.channel.guild) {
							try {
								message.removeReactions();
							} catch(e) {
								console.log(e);
							}
						}
						delete bot.menus[message.id];
					}, 900000),
					execute: async function(bot, m, e) {
						switch(e.name) {
							case "✅":
								try {
									await bot.utils.updateWelcomeConfig(bot, m.guild.id, {message: null});
								} catch(e) {
									return await m.channel.createMessage("ERR: "+e);
								}

								await m.channel.createMessage("Message reset!");
								break;
							case "❌":
								await m.channel.createMessage("Action cancelled.");
								break;
						}
					}
				};
				["✅","❌"].forEach(r => message.addReaction(r));
				return;
			}
		} else {
			try {
				await bot.stores.welcomeConfigs.update(msg.guild.id, {message: args.join(" ")});
			} catch(e) {
				return "ERR: "+e;
			}
			
			return "Message set!";
		}
	},
	guildOnly: true,
	alias: ["msg"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.enable = {
	help: ()=> "Enable welcome protocol",
	usage: ()=> [" - Enables welcome protocol"],
	execute: async (bot, msg, args)=>{
		var cfg = await bot.stores.welcomeConfigs.get(msg.guild.id);
		if(cfg.enabled) return "Welcome already enabled.";

		try {
			await bot.stores.welcomeConfigs.update(msg.guild.id, {enabled: true});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Welcome enabled!";
	},
	guildOnly: true,
	alias: ["e","1"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.disable = {
	help: ()=> "Disables welcome protocol.",
	usage: ()=> [" - Disables welcome protocol"],
	execute: async (bot, msg, args)=>{
		var cfg = await bot.stores.welcomeConfigs.get(msg.guild.id);
		if(!cfg.enabled) return "Welcome already disabled.";

		try {
			await bot.stores.welcomeConfigs.update(msg.guild.id, {enabled: false});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Welcome disabled!";
	},
	guildOnly: true,
	alias: ["d","0"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.preroles = {
	help: ()=> "Set roles to be added when users join the server",
	usage: ()=> [" <roles, to, add> - [Re]sets pre/autoroles for the server"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.welcomeConfigs.get(msg.guild.id);
		if(!args[0]) {
			if(!cfg.preroles) return "No preroles exist for this server.";

			var roles = cfg.preroles.map(r => msg.guild.roles.find(rl => rl.id == r)).filter(x => x!=undefined);
			var ms = `Current preroles:\n${roles.map(r => r.name).join("\n")}\nWould you like to reset them?`;
			if(roles.length < cfg.preroles.length) {
				cfg.preroles = cfg.preroles.filter(x => roles.find(r => r.id == x));
				try {
					await bot.stores.welcomeConfigs.update(msg.guild.id, {preroles: cfg.preroles});
				} catch(e) {
					ms += "\n\n(Invalid roles could not be removed from the database)";
				}
			}

			var message = await msg.channel.createMessage(ms);
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					if(message.channel.guild) {
						try {
							message.removeReactions();
						} catch(e) {
							console.log(e);
						}
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: async function(bot, m, e) {
					switch(e.name) {
						case "✅":
							try {
								await bot.stores.welcomeConfigs.update(m.guild.id, {preroles: []});
							} catch(e) {
								return await m.channel.createMessage("ERR: "+e);
							}
							
							await m.channel.createMessage("Roles reset!");
							break;
						case "❌":
							await m.channel.createMessage("Action cancelled.");
							break;
					}
				}
			};
			["✅","❌"].forEach(r => message.addReaction(r));
			return;
		}

		cfg.preroles = [];
		var results = [];
		for(var i = 0; i < args.length; i++) {
			var role = msg.guild.roles.find(r => r.id == args[i].replace(/[<#>]/g,"") || r.name.toLowerCase() == args[i].toLowerCase());
			if(role) {
				cfg.preroles.push(role.id);
				results.push({name: role.name})
			} else results.push({name: args[i], reason: "Role not found"});
		}

		try {
			await bot.stores.welcomeConfigs.update(msg.guild.id, {preroles: cfg.preroles});
		} catch(e) {
			return "ERR: "+e;
		}

		return {embed: {
			title: "Results",
			fields: [
				{name: "Indexed", value: results.filter(x => !x.reason).map(r => r.name).join("\n") || "(none)"},
				{name: "Not Indexed", value: results.filter(x => x.reason).map(r => `${r.name} - ${r.reason}`).join("\n") || "(none)"}
			]
		}}
	},
	guildOnly: true,
	alias: ["autoroles","autorole"],
	permissions: ["manageRoles","manageGuil"]
}

module.exports.subcommands.postroles = {
	help: ()=> "Set a list of roles to add to members after they're welcomed",
	usage: ()=> [" [roles, to, index] - Indexes roles to be added after using `hh!welcome [member]`"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.welcomeConfigs.get(msg.guild.id);
		if(!args[0]) {
			if(!cfg.postroles) return "No postroles exist for this server.";

			var roles = cfg.postroles.map(r => msg.guild.roles.find(rl => rl.id == r)).filter(x => x!=undefined);
			var ms = `Current postroles:\n${roles.map(r => r.name).join("\n")}\nWould you like to reset them?`;
			if(roles.length < cfg.postroles.length) {
				cfg.postroles = cfg.postroles.filter(x => roles.find(r => r.id == x));
				try {
					await bot.stores.welcomeConfigs.update(msg.guild.id, {postroles: cfg.postroles});
				} catch(e) {
					ms += "\n\n(Invalid roles could not be removed from the database)";
				}
			}

			var message = await msg.channel.createMessage(ms);
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					if(message.channel.guild) {
						try {
							message.removeReactions();
						} catch(e) {
							console.log(e);
						}
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: async function(bot, m, e) {
					switch(e.name) {
						case "✅":
							try {
								await bot.stores.welcomeConfigs.update(m.guild.id, {postroles: []});
							} catch(e) {
								return await m.channel.createMessage("ERR: "+e);
							}
							
							await m.channel.createMessage("Roles reset!");
							break;
						case "❌":
							await m.channel.createMessage("Action cancelled.");
							break;
					}
				}
			};
			["✅","❌"].forEach(r => message.addReaction(r));
			return;
		}

		cfg.postroles = [];
		var results = [];
		for(var i = 0; i < args.length; i++) {
			var role = msg.guild.roles.find(r => r.id == args[i].replace(/[<#>]/g,"") || r.name.toLowerCase() == args[i].toLowerCase());
			if(role) {
				cfg.postroles.push(role.id);
				results.push({name: role.name})
			} else results.push({name: args[i], reason: "Role not found"});
		}

		try {
			await bot.stores.welcomeConfigs.update(msg.guild.id, {postroles: cfg.postroles});
		} catch(e) {
			return "ERR: "+e;
		}

		return {embed: {
			title: "Results",
			fields: [
				{name: "Indexed", value: results.filter(x => !x.reason).map(r => r.name).join("\n") || "(none)"},
				{name: "Not Indexed", value: results.filter(x => x.reason).map(r => `${r.name} - ${r.reason}`).join("\n") || "(none)"}
			]
		}}
	},
	guildOnly: true,
	permissions: ["manageRoles","manageGuild"],
	alias: ["postrole","welcomerole","welcomeroles","welcroles","welcrole"]
}