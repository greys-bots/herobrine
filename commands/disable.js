module.exports = {
	help: ()=> "Disables a command/module or a command's subcommands.",
	usage: ()=> [" [command/module] <subcommand> - disables given command or its subcommand",
				" list - lists disabled commands"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		var disabled = cfg ? cfg.disabled : {modules: [], commands: [], levels: false};
		if(!args[0]) return msg.channel.createMessage("Please provide a command or module to disable.");
		if(args[0] == "disable" || args[0] == "enable") return msg.channel.createMessage("You can't disable this command.");
		var name = args.join(" ");
		if(bot.modules[name]) {
			if(disabled.modules == undefined) disabled.modules = [];
			if(disabled.modules.includes(name)) {
				msg.channel.createMessage("Module already disabled.")
			} else {
				disabled.modules.push(name);
				bot.db.query(`UPDATE configs SET disabled=? WHERE srv_id=?`,[disabled,msg.guild.id],(err,res)=>{
					if(err) {
						console.log(err);
						msg.channel.createMessage("There was an error.");
					} else {
						msg.channel.createMessage("Module disabled.")
					}
				});
			}
		} else {
			if(disabled.commands == undefined) disabled.commands = []
			await bot.parseCommand(bot, msg, args).then(dat =>{
				name = dat[2].split(" ");
				if((disabled.commands[name[0]] || disabled.commands[name.join(" ")])) {
					msg.channel.createMessage("Command already disabled.");
				} else {
					disabled.commands.push(name.join(" "));
					bot.db.query(`UPDATE configs SET disabled=? WHERE srv_id=?`,[disabled,msg.guild.id],(err,res)=>{
						if(err) {
							console.log(err);
							msg.channel.createMessage("There was an error.");
						} else {
							msg.channel.createMessage("Command disabled.")
						}
					});
				}
			}).catch(e => {
				if(["levels", "levelup", "levelups"].includes(args[0])) {
					disabled.levels = true
					bot.db.query(`UPDATE configs SET disabled=? WHERE srv_id=?`,[disabled,msg.guild.id],(err,res)=>{
						if(err) {
							console.log(err);
							msg.channel.createMessage("There was an error.");
						} else {
							msg.channel.createMessage("Levels disabled.")
						}
					});
				} else {
					msg.channel.createMessage("Could not disable: "+e);
				}
			});
		}
	},
	guildOnly: true,
	module: "admin",
	permissions: ["manageGuild"]
}