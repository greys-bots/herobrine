module.exports = {
	help: ()=> "Disables a command/module or a command's subcommands",
	usage: ()=> [" - Lists disabled commands",
				 " [command/module] <subcommand> - Disables given command or its subcommand"],
	execute: async (bot, msg, args) => {
		if(!args[0]) {
			var cfg = await bot.utils.getConfig(bot, msg.guild.id);
			if(!cfg || !cfg.disabled || (cfg.disabled && !cfg.disabled.commands && !cfg.disabled.levels)) return msg.channel.createMessage('No config found for this server')
			
			return msg.channel.createMessage({embed: {
				title: "Disabled Functions",
				fields: [
					{name: "Commands", value: cfg.disabled.commands[0] ? cfg.disabled.commands.sort().join("\n") : "(none)"},
					{name: "Levels", value: cfg.disabled.levels ? "Yes" : "No"}
				]
			}})
		}

		if(["disable", "enable"].includes(args[0].toLowerCase())) return msg.channel.createMessage("You can't disable or enable this command");
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		var dis;
		if(!cfg) return msg.guild.createMessage("No config registered for this server");
		if(!cfg.disabled) dis = {modules: [], commands: [], levels: false};
		else dis = cfg.disabled;
		if(!dis.commands) dis.commands = [];
		if(!dis.levels) dis.levels = false;
		console.log(dis)
		try {
			var {command} = await bot.parseCommand(bot, msg, args);
		} catch (e) {
			var command = undefined;
		}
		if(command) {
			var disabled = await bot.utils.isDisabled(bot, msg.guild.id, command, command.name);
			if(disabled) {
				return msg.channel.createMessage("Command already disabled")
			} else {
				dis.commands.push(command.name)
				var success = await bot.utils.updateConfig(bot, msg.guild.id, {disabled: dis});
				if(success) {
					msg.channel.createMessage("Disabled!")
				} else {
					msg.channel.createMessage("Something went wrong");
				}
			}
		} else {
			var cmd = args.join(" ").toLowerCase()
			if(["levels", "levelup", "levelups"].includes(cmd)) {
				dis.levels = true;
				var success = await bot.utils.updateConfig(bot, msg.guild.id, {disabled: dis});
				if(success) {
					msg.channel.createMessage("Disabled!")
				} else {
					msg.channel.createMessage("Something went wrong");
				}
			} else if(bot.modules.get(bot.mod_aliases.get(cmd))) {
				var mod = bot.modules.get(bot.mod_aliases.get(cmd));
				dis.commands = dis.commands.concat(mod.commands.map(c => c.name));
				var success = await bot.utils.updateConfig(bot, msg.guild.id, {disabled: dis});
				if(success) {
					msg.channel.createMessage("Disabled!")
				} else {
					msg.channel.createMessage("Something went wrong");
				}
			} else {
				return msg.channel.createMessage("Command/module not found");
			}
		}
	},
	subcommands: {},
	guildOnly: true,
	module: "admin",
	alias: ["dis","disabled"],
	permissions: ["manageGuild"]
}

module.exports.subcommands.view = {
	help: ()=> "View currently disabled commands and modules.",
	usage: ()=> [" - Views the disabled config for the server"],
	execute: async (bot, msg, args) => {
		
	}
}