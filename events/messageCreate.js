module.exports = async (msg, bot) => {
	if(msg.author.bot) return;

	var lvlup;
	try {
		lvlup = await bot.stores.profiles.handleExperience(msg.author.id);
	} catch(e) {
		await msg.channel.send(e);
	}
	if(lvlup.message) await msg.channel.send(lvlup.message.replace("$USER", msg.author.username));
}