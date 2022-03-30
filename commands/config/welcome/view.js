module.exports = {
	data: {
		name: 'view',
		description: "View the current welcome config"
	},
	usage: [
		"- Views the welcome config"
	],
	async execute(ctx) {
		var config = await ctx.client.stores.welcomeConfigs.get(ctx.guild.id);
		if(!config?.id) return "No config to show";

		return {embeds: [config.buildEmbed()]};
	}
}