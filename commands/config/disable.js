var { confirmReacts } = require('../../extras');

module.exports = {
	data: {
		name: 'disable',
		description: "Disables a command/module or a command's subcommands",
		options: [
			{
				name: 'module',
				description: "Select a module to disable",
				type: 3,
				required: false
			},
			{
				name: 'command',
				description: "Select a command to disable",
				type: 3,
				required: false
			},
			{
				name: 'subcommand',
				description: "Select a subcommand to disable",
				type: 3,
				required: false
			}
		]
	},
	usage: ()=> ["- Lists disabled commands",
				 "[module] <command> <subcommand> - Disables given module, command, or subcommand"],
	extra: "Example:\n" +
		   "`/admin disable module:fun command:profile` - Disables the entire profile command and subcommands",
	execute: async (ctx) => {
		const { client: bot, options: opts } = ctx;
		var modstr = opts.getString('module')?.trim().toLowerCase();
		var cmdstr = opts.getString('command')?.trim().toLowerCase();
		var scmdstr = opts.getString('subcommand')?.trim().toLowerCase();

		var cfg = await bot.stores.configs.get(ctx.guild.id);
		
		if(!modstr) {
			if(!cfg || !cfg.disabled) return "Nothing is disabled in this server";
			return {
				embeds: [{
					title: "Disabled Commands",
					description: cfg.disabled.sort().join("\n")
				}],
				ephemeral: true
			}
		}

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

		if(dis.includes(string)) return "Target already disabled!";
		else dis.push(string)

		try {
			cfg.disabled = dis;
			await cfg.save();
		} catch(e) {
			return "ERR: "+e;
		}

		return "Command/module disabled!";
	}
}