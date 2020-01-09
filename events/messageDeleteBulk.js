module.exports = async (msgs, bot) => {
	if(!msg.channel.guild) return;
	await bot.utils.deletePollsByID(bot, msgs[0].channel.guild.id, msgs.map(msg => msg.id));
}