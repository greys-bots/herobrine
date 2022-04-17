module.exports = {
	data: {
		name: 'enable',
		description: "Enable level-up messages on an individual basis"
	},
	usage: [
		"- Enables level-up messages for yourself"
	],
	async execute(ctx) {
		var profile = await ctx.client.stores.profiles.get(ctx.user.id);
		profile.disabled = false;
		await profile.save();

		return "Level-up messages enabled!"
	}
}