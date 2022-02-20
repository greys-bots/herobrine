var { confirmReacts } = require('../../extras');

module.exports = {
	help: ()=> "Disables a command/module or a command's subcommands",
	usage: ()=> ["- Lists disabled commands",
				 "[command/module] <subcommand> - Disables given command or its subcommand"],
	execute: async (bot, msg, args) => {
		var cfg;
		try {
			cfg = await bot.stores.configs.get(msg.guild.id);
		} catch(e) {
			return "ERR: "+e;
		}
		
		if(!args[0]) {
			if(!cfg || !cfg.disabled) return "Nothing is disabled in this server";
			
			return {embed: {
				title: "Disabled Commands",
				description: cfg.disabled.sort().join("\n")
			}}
		}

		if(["disable", "enable"].includes(args[0].toLowerCase())) return "You can't disable or enable this command.";
		var dis;
		if(!cfg.disabled) dis = [];
		else dis = cfg.disabled;

		var cmd = args.join(" ").toLowerCase();
		if(bot.modules.get(bot.mod_aliases.get(cmd))) {
			var mod = bot.modules.get(bot.mod_aliases.get(cmd));
			dis = dis.concat(mod.commands.map(c => c.name).filter(x => !["enable", "disable"].includes(x) && !dis.includes(x)));
		} else {
			try {
				var {command} = await bot.handlers.command.parse(args.join(" "));
			} catch (e) {
				command = undefined;
			}
			if(!command) return "Command/module not found";

			if(dis.includes(command.name)) {
				return "That module is already disabled!";
			} else {
				if(command.subcommands) {
					var m = await msg.channel.send({
						embeds: [{
							title: "Would you like to disable all subcommands as well?",
							fields: [{
								name: 'Subcommands',
								value: command.subcommands.map(c => c.name).join("\n")
							}]
						}]
					});
					confirmReacts.forEach(r => m.react(r));
					var conf = await bot.utils.getConfirmation(bot, m, msg.author);
					if(conf.msg) dis.push(command.name);
					else dis = dis.concat([command.name, ...command.subcommands.map(c => c.name)]);
				} else dis.push(command.name);
			}
		}

		try {
			cfg.disabled = dis;
			await cfg.save();
		} catch(e) {
			return "ERR: "+e;
		}

		return "Command/module disabled!";
	},
	guildOnly: true,
	module: "admin",
	alias: ["dis","disabled"],
	permissions: ["MANAGE_GUILD"]
}