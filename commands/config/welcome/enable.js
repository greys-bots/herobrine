module.exports = {
	data: {
		name: 'enable',
		description: "Enable the welcome config"
	},
	usage: [
		"- Enables the welcome config"
	],
	async execute(ctx) {
		var config = await ctx.client.stores.welcomeConfigs.get(ctx.guild.id);
		config.enabled = true;
		await config.save();
		return "Config updated!";
	}
}