module.exports = async (msg, bot) => {
	if(!msg.channel.guild) return;
	await bot.utils.deleteReactPost(bot, msg.channel.guild.id, msg.id);
	await bot.utils.deletePoll(bot, msg.channel.guild.id, msg.channel.id, msg.id);
	await bot.utils.deleteStarPost(bot, msg.channel.guild.id, msg.channel.id, msg.id);
}