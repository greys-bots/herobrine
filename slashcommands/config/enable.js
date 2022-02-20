var { confirmReacts } = require('../../extras');

module.exports = {
	data: {
		name: 'enable',
		description: "Enables a command/module or a command's subcommands",
		options: [
			{
				name: 'module',
				description: "Select a module to enable",
				type: 3,
				required: true
			},
			{
				name: 'command',
				description: "Select a command to enable",
				type: 3,
				required: false
			},
			{
				name: 'subcommand',
				description: "Select a subcommand to enable",
				type: 3,
				required: false
			}
		]
	},
	usage: ()=> ["[module] <command> <subcommand> - Enables given module, command, or subcommand"],
	extra: "Example:\n" +
		   "`/admin enable module:fun` - Enables the fun module",
	execute: async (ctx) => {
		const { client: bot, options: opts } = ctx;
		var modstr = opts.getString('module')?.trim().toLowerCase();
		var cmdstr = opts.getString('command')?.trim().toLowerCase();
		var scmdstr = opts.getString('subcommand')?.trim().toLowerCase();

		var cfg = await bot.stores.configs.get(ctx.guild.id);

		if(["disable", "enable"].includes(cmdstr)) return "You can't disable or enable this command.";
		var dis;
		if(!cfg.disabled) dis = [];
		else dis = cfg.disabled;

		var string = "";
		var mod = bot.slashCommands.get(modstr);
		if(!mod) return "Module not found";
		string = mod.data.name ?? mod.name;

		var cmd;
		if(cmdstr && mod.options) {
			cmd = mod.options.find(x => x.data.name == cmdstr);
			if(!cmd) return "Command not found";
			string += ` ${cmd.data.name}`;
		}

		var scmd;
		if(scmdstr && cmd?.options) {
			scmd = cmd.options.find(x => x.data.name == scmdstr);
			if(!scmd) return "Subcommand not found";
			string += ` ${scmd.data.name}`;
		}

		if(!dis.includes(string)) return "Target already enabled!";
		else dis = dis.filter(x => x != string)

		try {
			cfg.disabled = dis;
			await cfg.save();
		} catch(e) {
			return "ERR: "+e;
		}

		return "Command/module disabled!";
	}
}