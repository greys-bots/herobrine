module.exports = {
	data: {
		name: 'disable',
		description: "Disable level-up messages on an individual basis"
	},
	usage: [
		"- Disables level-up messages for yourself"
	],
	async execute(ctx) {
		var profile = await ctx.client.stores.profiles.get(ctx.user.id);
		profile.disabled = true;
		await profile.save();

		return "Level-up messages disabled!"
	}
}