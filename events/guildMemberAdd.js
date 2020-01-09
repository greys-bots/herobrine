module.exports = async (guild, member, bot)=>{
	if(member.user.bot) return;
	var cfg = await bot.utils.getConfig(bot, guild.id);
	if(cfg){
		if(cfg.welcome.enabled && cfg.welcome.msg){
			var msg = cfg.welcome.msg;
			for(var i = 0; i < Object.keys(bot.strings.welc_strings).length; i++) {
				msg = msg.replace(s,eval("`"+bot.strings.welc_strings[Object.keys(bot.strings.welc_strings)[i]]+"`"),"g");
			}

			bot.createMessage(cfg.welcome.channel, msg);
		}
		if(cfg.welcome.enabled && cfg.autoroles){
			for(var i = 0; i < cfg.autoroles.length; i++) {
				if(guild.roles.find(rl => rl.id == cfg.autoroles[i])){
					member.addRole(cfg.autoroles[i]);
				} else {
					guild.members.find(m => m.id == guild.ownerID).user.getDMChannel().then((c)=> c.createMessage("Autorole not found: "+cfg.autoroles[i]+"\nRemoving role from autoroles."));
					cfg.autoroles = cfg.autoroles.filter(r => r != cfg.autoroles[i]);
					await bot.utils.updateConfig(bot, msg.guild.id, {autoroles: cfg.autoroles});
				}
			}
		}
	}
}