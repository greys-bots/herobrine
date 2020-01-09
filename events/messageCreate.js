module.exports = async (msg, bot) =>{
	if(msg.author.bot) return;

	if(msg.content.toLowerCase()=="hey herobrine"){
		msg.channel.createMessage("That's me!");
		return;
	}

	var cfg;
	if(msg.guild) cfg = await bot.utils.getConfig(bot, msg.guild.id);
	else cfg = undefined;

	var prefix = (msg.guild && 
				  cfg && 
				  (cfg.prefix!= undefined && 
				  cfg.prefix!="")) ? 
				  new RegExp(`^(?:${cfg.prefix}|<@!?${bot.user.id}>)`, "i") :
				  new RegExp(`^(${bot.cfg.prefix.join("|")}|<@!?${bot.user.id}>)`, "i");

	if(bot.paused && !prefix.test(msg.content.toLowerCase())) {
		return;
	} else if(bot.paused && (new RegExp(`^(${bot.cfg.prefix.join("|")})unpause`, "i").test(msg.content.toLowerCase()) && bot.cfg.accepted_ids.includes(msg.author.id))){
		bot.commands.unpause.execute(bot, msg, msg.content.replace(prefix, ""));
		return;
	}

	if(msg.guild) {
		var lvlup = await bot.utils.handleBonus(bot, msg);
		if(lvlup.success) {
			if(lvlup.msg && !(cfg && cfg.disabled && cfg.disabled.levels)) msg.channel.createMessage(lvlup.msg);
		} else {
			console.log("Couldn't handle cash/exp");
		}
	}

	if(msg.guild && !cfg) await bot.utils.createConfig(bot, msg.guild.id);

	if(msg.guild) {
		var tag = await bot.utils.getTag(bot, msg.guild.id, msg.content.replace(prefix, "").toLowerCase());
		if(tag) return msg.channel.createMessage(typeof tag.value == "string" ? tag.value : bot.utils.randomText(tag.value));
	}

	if(prefix.test(msg.content.toLowerCase())){

		bot.writeLog(bot, "msg", msg);

		let args = msg.content.replace(prefix, "").split(" ");
		if(!args[0]) args.shift();
		if(!args[0]) return msg.channel.createMessage("That's me!");
		if(args[args.length-1] == "help") return bot.commands.get("help").execute(bot, msg, args.slice(0,args.length-1));
		var {command, nargs} = await bot.parseCommand(bot, msg, args);
		if(!command) ({command, nargs} = await bot.parseCustomCommand(bot, msg, args) || {});
		if(!command) return msg.channel.createMessage("Command not found");

		if(command.guildOnly && !msg.guild) {
			return msg.channel.createMessage("This command can only be used in guilds.");
		}
		if(msg.guild) {
			var check;
			check = await bot.utils.checkPermissions(bot, msg, command);
			if(!check && !bot.cfg.accepted_ids.includes(msg.author.id)) {
				return msg.channel.createMessage("You do not have permission to use this command.");
			}
			check = await bot.utils.isDisabled(bot, msg.guild.id, command, command.name);
			if(check && !["disable", "enable", "help"].includes(command.name)) {
				return msg.channel.createMessage("That command is disabled.");
			}
		}
		command.execute(bot, msg, nargs, command);
		
	}
}