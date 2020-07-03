module.exports = {
	help: ()=> "Disables a command/module or a command's subcommands",
	usage: ()=> [" - Lists disabled commands",
				 " [command/module] <subcommand> - Disables given command or its subcommand"],
	execute: async (bot, msg, args) => {
		if(!args[0]) {
			var cfg = await bot.stores.configs.get(msg.guild.id);
			if(!cfg || !cfg.disabled || (cfg.disabled && !cfg.disabled.commands && !cfg.disabled.levels)) return msg.channel.createMessage('No config found for this server')
			
			return {embed: {
				title: "Disabled Functions",
				fields: [
					{name: "Commands", value: cfg.disabled.commands[0] ? cfg.disabled.commands.sort().join("\n") : "(none)"},
					{name: "Levels", value: cfg.disabled.levels ? "Yes" : "No"}
				]
			}}
		}

		if(["disable", "enable"].includes(args[0].toLowerCase())) return "You can't disable or enable this command.";
		var cfg = await bot.stores.configs.get(msg.guild.id);
		var dis;
		if(!cfg) cfg = {new: true};
		if(!cfg.disabled) dis = {modules: [], commands: [], levels: false};
		else dis = cfg.disabled;
		if(!dis.commands) dis.commands = [];
		if(!dis.levels) dis.levels = false;

		try {
			var {command} = await bot.parseCommand(bot, msg, args);
		} catch (e) {
			var command = undefined;
		}
		if(command) {
			var disabled = await bot.utils.isDisabled(bot, msg.guild.id, command, command.name);
			if(disabled) {
				return "Command already disabled.";
			} else {
				dis.commands.push(command.name)
				try {
					if(cfg.new) bot.stores.configs.create(msg.guild.id, {disabled: dis});
					else await bot.stores.configs.update(msg.guild.id, {disabled: dis});
				} catch(e) {
					return "ERR: "+e;
				}
				
				return "Disabled!";
			}
		} else {
			var cmd = args.join(" ").toLowerCase()
			if(["levels", "levelup", "levelups"].includes(cmd)) {
				dis.levels = true;
				try {
					if(cfg.new) bot.stores.configs.create(msg.guild.id, {disabled: dis});
					else await bot.stores.configs.update(msg.guild.id, {disabled: dis});
				} catch(e) {
					return "ERR: "+e;
				}
				
				return "Disabled!";
			} else if(bot.modules.get(bot.mod_aliases.get(cmd))) {
				var mod = bot.modules.get(bot.mod_aliases.get(cmd));
				dis.commands = dis.commands.concat(mod.commands.map(c => c.name));
				try {
					if(cfg.new) bot.stores.configs.create(msg.guild.id, {disabled: dis});
					else await bot.stores.configs.update(msg.guild.id, {disabled: dis});
				} catch(e) {
					return "ERR: "+e;
				}
				
				return "Disabled!";
			} else {
				return "Command/module not found.";
			}
		}
	},
	subcommands: {},
	guildOnly: true,
	module: "admin",
	alias: ["dis","disabled"],
	permissions: ["manageGuild"]
}