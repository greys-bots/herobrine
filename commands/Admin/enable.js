var { confirmReacts } = require('../../extras');

module.exports = {
	help: ()=> "Enables a command/module or a command's subcommands.",
	usage: ()=> ["[command/module] <subcommand> - enables given command or its subcommand"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return "Please provide a command or module to enable.";
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg || !cfg.disabled || (cfg.disabled && !cfg.disabled[0])) return "Nothing is disabled in this server!";
		var dis = cfg.disabled;

		var cmd = args.join(" ").toLowerCase();
		if(bot.modules.get(bot.mod_aliases.get(cmd))) {
			var mod = bot.modules.get(bot.mod_aliases.get(cmd));
			dis = dis.filter(x => !mod.commands.get(x));
		} else {
			try {
				var {command} = await bot.handlers.command.parse(args.join(" "));
			} catch (e) {
				command = undefined;
			}
			if(!command) return "Command/module not found";
			
			if(!dis.includes(command.name)) {
				return "That command is already enabled!"
			} else {
				if(command.subcommands) {
					var sc = command.subcommands.map(c => c.name)
					var m = await msg.channel.send({
						embeds: [{
							title: "Would you like to enable any disabled subcommands as well?",
							fields: [{
								name: 'Subcommands',
								value: sc.join("\n")
							}]
						}]
					});
					confirmReacts.forEach(r => m.react(r));
					var conf = await bot.utils.getConfirmation(bot, m, msg.author);
					if(conf.msg) dis = dis.filter(x => x != command.name);
					else {
						for(var c of [...sc, command.name]) {
							dis = dis.filter(x => x != c);
						}
					}
				} else dis = dis.filter(x => x != command.name);
			}
		}

		try {
			cfg.disabled = dis;
			await cfg.save();
		} catch(e) {
			return "ERR: "+e;
		}

		return "Command/module enabled!";
	},
	guildOnly: true,
	module: "admin",
	permissions: ["MANAGE_GUILD"]
}