module.exports = {
	help: ()=> "Enables a command/module or a command's subcommands.",
	usage: ()=> [" [command/module] <subcommand> - enables given command or its subcommand",
				" list - lists enabled commands"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		var disabled = cfg ? cfg.disabled : {modules: [], commands: []};
		if(!args[0]) return msg.channel.createMessage("Please provide a command or module to disable.");
		if(args[0] == "disable") return msg.channel.createMessage("You can't disable or enable this command.");
		var name = args.join(" ");
		if(bot.modules[name]) {
			if(disabled.modules == undefined) {
				return msg.channel.createMessage("Module aleady enabled.");
			}
			if(disabled.modules.includes(name)) {
				disabled.modules = disabled.modules.filter(m => m != name);
				bot.db.query(`UPDATE configs SET disabled=? WHERE srv_id=?`,[disabled,msg.guild.id],(err,res)=>{
					if(err) {
						console.log(err);
						msg.channel.createMessage("There was an error.");
					} else {
						msg.channel.createMessage("Module enabled.")
					}
				});
			} else {
				msg.channel.createMessage("Module already enabled.");
			}
		} else {
			if(disabled.commands == undefined) {
				return msg.channel.createMessage("Command already enabled.");
			}
			await bot.parseCommand(bot, msg, args).then(dat =>{
				name = dat[2].split(" ");
				if((disabled.commands[name[0]] || disabled.commands[name.join(" ")])) {
					disabled.commands.filter(c => c != name.join(" "));
					bot.db.query(`UPDATE configs SET disabled=? WHERE srv_id=?`,[disabled,msg.guild.id],(err,res)=>{
						if(err) {
							console.log(err);
							msg.channel.createMessage("There was an error.");
						} else {
							msg.channel.createMessage("Command disabled.")
						}
					});
				} else {
					msg.channel.createMessage("Command already enabled.");
				}
			}).catch(e => {
				msg.channel.createMessage("Could not disable: "+e);
			});
		}
	},
	guildOnly: true,
	module: "admin",
	permissions: ["manageGuild"]
}