module.exports = async (msg, bot) =>{
	//todo: make this look better
	//good god it is ugly
	if(msg.author.bot) return;

	if(msg.content.toLowerCase()=="hey herobrine"){
		msg.channel.createMessage("That's me!");
		return;
	}

	var cfg;
	if(msg.guild) cfg = await bot.stores.configs.get(msg.guild.id);
	else cfg = undefined;

	var prefix;

	if(msg.guild && cfg && cfg.prefix) prefix =  new RegExp(`^(?:${cfg.prefix}|<@!?${bot.user.id}>)`, "i");
	else prefix = new RegExp(`^(${bot.cfg.prefix.join("|")}|<@!?${bot.user.id}>)`, "i");	  

	if(bot.paused && !prefix.test(msg.content.toLowerCase())) {
		return;
	} else if(bot.paused && (new RegExp(`^(${bot.cfg.prefix.join("|")})unpause`, "i").test(msg.content.toLowerCase()) && bot.cfg.accepted_ids.includes(msg.author.id))){
		bot.commands.unpause.execute(bot, msg, msg.content.replace(prefix, ""));
		return;
	}

	if(msg.guild) {
		if(!cfg) cfg = await bot.stores.configs.create(msg.guild.id);

		try {

		} catch(e) {
			console.log("Couldn't handle cash/exp: "+e);
		}

		if(lvlup.success && lvlup.lvl && !(cfg.disabled && cfg.disabled.levels)) {
			msg.channel.createMessage(`Congratulations, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}! You are now level ${lvlup.lvl}!`)
		}

		var tag = await bot.stores.responses.get(msg.guild.id, msg.content.replace(prefix, "").toLowerCase());
		if(tag) return msg.channel.createMessage(typeof tag.value == "string" ? tag.value : bot.utils.randomText(tag.value));
	}

	if(!prefix.test(msg.content.toLowerCase())) return;

	var {command, args, permcheck} = await bot.parseCommand(bot, msg, msg.content.replace(prefix, "").split(" "));
	if(!command) ({command, args} = await bot.parseCustomCommand(bot, msg, msg.content.replace(prefix, "").split(" ")));
	if(!command) return msg.channel.createMessage("Command not found.");
	
	console.log(command.name);
	if(command.guildOnly && !msg.guild) return msg.channel.createMessage("This command can only be used in guilds.");
	var cfg = msg.guild ? await bot.stores.configs.get(msg.guild.id) : {};
	if(cfg && cfg.blacklist && cfg.blacklist.includes(msg.author.id)) return msg.channel.createMessage("You have been banned from using commands.");
	if(command.permissions && !permcheck) return msg.channel.createMessage("You don't have permission to do this.");
	
	var result;
	try {
		result = await command.execute(bot, msg, args, command);
	} catch(e) {
		console.log(e);
		return msg.channel.createMessage("ERR: "+(e.message || e));
	}

	if(!result) return;
	if(typeof result == "object" && result[0]) { //embeds
		var message = await msg.channel.createMessage(result[0]);
		if(result[1]) {
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				data: result,
				index: 0,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					try {
						message.removeReactions();
					} catch(e) {
						console.log(e);
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["⬅️", "➡️", "⏹️"].forEach(r => message.addReaction(r));
		}
	} else msg.channel.createMessage(result);

	command.execute(bot, msg, nargs, command);
}