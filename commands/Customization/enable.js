module.exports = {
	help: ()=> "Enables a command/module or a command's subcommands",
	usage: ()=> [" [command/module] <subcommand> - Enables given command or its subcommand"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a command or module to enable.";
		if(["disable", "enable"].includes(args[0].toLowerCase())) return msg.channel.createMessage("You can't disable or enable this command");
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg) return "No config registered for this server; nothing to enable.";
		if(!cfg.disabled) return "Nothing is disabled in this server.";
		var dis = cfg.disabled;

		try {
			var {command} = await bot.parseCommand(bot, msg, args);
		} catch (e) {
			var command = undefined;
		}

		if(command) {
			var disabled = await bot.utils.isDisabled(bot, msg.guild.id, command, command.name);
			if(!disabled) {
				return "Command already enabled.";
			} else {
				dis.commands = dis.commands.filter(x => x != command.name);

				try {
					await bot.stores.configs.update(msg.guild.id, {disabled: dis});
				} catch(e) {
					return "ERR: "+e;
				}

				return "Enabled!";
			}
		} else {
			cmd = args.join(" ").toLowerCase()
			if(["levels", "levelup", "levelups"].includes(cmd)) {
				dis.levels = false;

				try {
					await bot.stores.configs.update(msg.guild.id, {disabled: dis});
				} catch(e) {
					return "ERR: "+e;
				}

				return "Enabled!";
			} else if(bot.modules.get(bot.mod_aliases.get(cmd))) {
				var mod = bot.modules.get(bot.mod_aliases.get(cmd));
				dis.commands = dis.commands.filter(x => !mod.commands.get(x));
				
				try {
					await bot.stores.configs.update(msg.guild.id, {disabled: dis});
				} catch(e) {
					return "ERR: "+e;
				}

				return "Enabled!";
			} else {
				return "Command/module not found.";
			}
		}
		
	},
	guildOnly: true,
	module: "admin",
	permissions: ["manageGuild"]
}