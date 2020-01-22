module.exports = {
	help: ()=> "Displays help embed.",
	usage: ()=> [" - Displays help for all commands.",
				" [command] - Displays help for specfic command.",
				" [command] [subcommand]... - Displays help for a command's subcommands"],
	execute: async (bot, msg, args) => {
		if(!args[0]) {
			//setup
			var modules = bot.modules.map(m => m);
			modules.forEach(m => m.commands = m.commands.map(c => c));

			var embeds = [{embed: {
				title: "Herobrine",
				description: [
					"*A multi-purpose moderation and fun bot for Discord*\n",
					"I'm Herobrine! My job is to help admins manage their Discord server, ",
					"as well as provide some other functionality that's useful for folks"
				].join(""),
				fields: [
					{
						name: "Features",
						value: [
							"- Reaction roles",
							"- Self roles",
							"- Starboards (yes, several per server!)",
							"- Notes and reminders",
							"- And lots more!"							
						].join("\n")
					},
					{
						name: "Modules",
						value: [
							"My commands are split into *modules*, or groups\n",
							"Tabbing through this embed by hitting the \u2b05 and \u27a1 ",
							"reactions will give you a better idea of what each module ",
							"does. You can also enable/disable specific modules, or get ",
							"more info on a module using `hh!help [module]`"
						].join("")
					},
					{
						name: "Customization",
						value: [
							"Your experience with me can be customized! You can:",
							"- Create custom commands (`hh!cc`)",
							"- Change my prefix (`hh!prefix`)",
							"- Set your own command aliases (`hh!`)"
						].join("\n")
					}
				],
				footer: {
					icon_url: bot.user.avatarURL,
					text: "Use the arrow reacts to navigate back and forth"
				}
			}}];
			for(var i = 0; i < modules.length; i++) {
				if(modules[i].commands.length == 0) continue;
				var tmp_embeds = await bot.utils.genEmbeds(bot, modules[i].commands, c => {
					return {name:  `**${bot.cfg.prefix[0] + c.name}**`, value: c.help()}
				}, {
					title: `**${modules[i].name}**`,
					description: modules[i].description,
					color: parseInt(modules[i].color, 16) || parseInt("555555", 16),
					footer: {
						icon_url: bot.user.avatarURL,
						text: "Use the arrow reacts to navigate back and forth"
					}
				}, 10, {addition: ""})
				
				embeds = embeds.concat(tmp_embeds);
			}

			if(embeds[1]) {
				for(let i=0; i<embeds.length; i++) {
					embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${bot.commands.size} commands total)`;
				}
			}	

			var message = await msg.channel.createMessage(embeds[0]);
			if(embeds[1]) {
				if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
					user: msg.author.id,
					data: embeds,
					index: 0,
					timeout: setTimeout(()=> {
						if(!bot.menus[message.id]) return;
						try {
							message.removeReactions();
						} catch(e) {
							console.log(e);
						}
						delete bot.menus[msg.author.id];
					}, 900000),
					execute: bot.utils.paginateEmbeds
				};
				["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
			}
			return;
		}

		if(bot.modules.get(args.join(" ").toLowerCase())) {
			let module = bot.modules.get(args.join(" ").toLowerCase());
			if(!module) return "Command/module not found";
			module.commands = module.commands.map(c => c);

			var embeds = await bot.utils.genEmbeds(bot, module.commands, c => {
				return {name: `**${bot.cfg.prefix[0] + c.name}**`, value: c.help()}
			}, {
				title: `**${module.name}**`,
				description: module.description,
				color: parseInt(module.color, 16) || parseInt("555555", 16),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "Use the arrow reacts to navigate back and forth"
				}
			}, 10, {addition: ""});

			for(let i=0; i<embeds.length; i++) {
				if(embeds.length > 1) embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${module.commands.length} commands total)`;
			}

			var message = await msg.channel.createMessage(embeds[0]);
			if(embeds[1]) {
				if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
					user: msg.author.id,
					data: embeds,
					index: 0,
					timeout: setTimeout(()=> {
						if(!bot.menus[message.id]) return;
						try {
							message.removeReactions();
						} catch(e) {
							console.log(e);
						}
						delete bot.menus[msg.author.id];
					}, 900000),
					execute: bot.utils.paginateEmbeds
				};
				["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
			}
		} else if(bot.commands.get(bot.aliases.get(args[0].toLowerCase()))) {
			let {command} = await bot.parseCommand(bot, msg, args);
			var embed = {embed: {
				title: `Help | ${command.name.toLowerCase()}`,
				description: command.help(),
				fields: [
					{name: "**Usage**", value: `${command.usage().map(c => `**${bot.cfg.prefix[0] + command.name}**${c}`).join("\n")}`},
					{name: "**Aliases**", value: `${command.alias ? command.alias.join(", ") : "(none)"}`},
					{name: "**Subcommands**", value: `${command.subcommands ?
							command.subcommands.map(sc => `**${bot.cfg.prefix[0]}${sc.name}** - ${sc.help()}`).join("\n") : 
							"(none)"}`}
				],
				color: parseInt(command.module.color, 16) || parseInt("555555", 16),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "Arguments like [this] are required, arguments like <this> are optional"
				}
			}};
			if(command.desc) embed.embed.fields.push({name: "**Extra**", value: command.desc()});
			if(command.permissions) embed.embed.fields.push({name: "**Permissions**", value: command.permissions.join(", ")});

			return msg.channel.createMessage(embed);
		} else msg.channel.createMessage("Command/module not found");
	},
	alias: ["h", "halp", "?"]
}