module.exports = {
	data: {
		name: 'disable',
		description: "Disable the welcome config"
	},
	usage: [
		"- Disables the welcome config"
	],
	async execute(ctx) {
		var config = await ctx.client.stores.welcomeConfigs.get(ctx.guild.id);
		config.enabled = false;
		await config.save();
		return "Config updated!";
	}
}