module.exports = async (guild, role, bot) => {
	await bot.utils.deleteSelfRole(bot, guild.id, role.id);

	var bundles = await bot.utils.getBundlesByRole(bot, guild.id, role.id);
	if(bundles && bundles[0]) {
		for(var i = 0; i < bundles.length; i++) {
			await bot.utils.updateBundle(bot, guild.id, bundles[i].hid, {roles: bundles[i].roles.filter(x => x != roles.id)})
		}
	}
}