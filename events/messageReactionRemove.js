module.exports = async (msg, emoji, user, bot) => {
	if(bot.user.id == user) return;
	if(msg.channel.guild) {
		var em;
		if(emoji.id) em = `:${emoji.name}:${emoji.id}`;
		else em = emoji.name;

		var message;
		try {
			message = await bot.getMessage(msg.channel.id, msg.id);
		} catch(e) {
			console.log(e.stack);
			return;
		}
		await bot.utils.updateStarPost(bot, msg.channel.guild.id, msg.id, {emoji: em, count: message.reactions[em.replace(/^:/,"")] ? message.reactions[em.replace(/^:/,"")].count : 0})
	}
}