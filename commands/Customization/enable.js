module.exports = {
	help: ()=> "Enables a command/module or a command's subcommands",
	usage: ()=> [" [command/module] <subcommand> - Enables given command or its subcommand"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a command or module to enable.");
		if(["disable", "enable"].includes(args[0].toLowerCase())) return msg.channel.createMessage("You can't disable or enable this command");
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.guild.createMessage("No config registered for this server");
		if(!cfg.disabled) return msg.guild.createMessage("Nothing is disabled in this server");
		var dis = cfg.disabled;
		try {
			var {command} = await bot.parseCommand(bot, msg, args);
		} catch (e) {
			var command = undefined;
		}
		if(command) {
			var disabled = await bot.utils.isDisabled(bot, msg.guild.id, command, command.name);
			if(!disabled) {
				return msg.channel.createMessage("Command already enabled")
			} else {
				dis.commands = dis.commands.filter(x => x != command.name);
				var success = await bot.utils.updateConfig(bot, msg.guild.id, {disabled: dis});
				if(success) {
					msg.channel.createMessage("Enabled!")
				} else {
					msg.channel.createMessage("Something went wrong");
				}
			}
		} else {
			cmd = args.join(" ").toLowerCase()
			if(["levels", "levelup", "levelups"].includes(cmd)) {
				dis.levels = false;

				var success = await bot.utils.updateConfig(bot, msg.guild.id, {disabled: dis});
				if(success) {
					msg.channel.createMessage("Enabled!")
				} else {
					msg.channel.createMessage("Something went wrong");
				}
			} else if(bot.modules.get(bot.mod_aliases.get(cmd))) {
				var mod = bot.modules.get(bot.mod_aliases.get(cmd));
				dis.commands = dis.commands.filter(x => !mod.commands.get(x));
				var success = await bot.utils.updateConfig(bot, msg.guild.id, {disabled: dis});
				if(success) {
					msg.channel.createMessage("Enabled!")
				} else {
					msg.channel.createMessage("Something went wrong");
				}
			} else {
				return msg.channel.createMessage("Command/module not found");
			}
		}
		
	},
	guildOnly: true,
	module: "admin",
	permissions: ["manageGuild"]
}