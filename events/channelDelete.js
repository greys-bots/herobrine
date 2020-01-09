module.exports = async (channel, bot) => {
	if(!msg.channel.guild) return;
	await bot.utils.deletePollsByChannel(bot, channel.guild.id, channel.id);
}