module.exports = async (guild, member, bot)=>{
	if(member.user.bot) return;
	var cfg = await bot.utils.getWelcomeConfig(bot, guild.id);
	if(!cfg || (cfg && !cfg.enabled)) return;
	if(cfg.message) {
		var msg = cfg.message;
		for(var i = 0; i < Object.keys(bot.strings.welc_strings).length; i++) {
			msg = msg.replace(Object.keys(bot.strings.welc_strings)[i], eval("`"+bot.strings.welc_strings[Object.keys(bot.strings.welc_strings)[i]]+"`"),"g");
		}
		bot.createMessage(cfg.channel, msg);
	}
	if(cfg.preroles) {
		var invalid = [];
		for(var i = 0; i < cfg.preroles.length; i++) {
			if(guild.roles.find(rl => rl.id == cfg.preroles[i])){
				member.addRole(cfg.preroles[i]);
			} else {
				invalid.push(cfg.preroles[i])
			}
		}
		if(invalid[0]) {
			cfg.preroles = cfg.preroles.filter(x => !invalid.includes(x));
			await bot.utils.updateWelcomeConfig(bot, msg.guild.id, {preroles: cfg.preroles});
		}
	}
}