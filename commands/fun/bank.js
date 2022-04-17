module.exports = {
	data: {
		name: 'bank',
		description: "View your current cash balance"
	},
	usage: [
		"- View your cash balance"
	],
	async execute(ctx) {
		var profile = await ctx.client.stores.profiles.get(ctx.user.id);

		return {embeds: [{
			title: "Balance",
			description: `:dollar: ${profile.cash}`,
			color: 0x55aa55
		}]}
	}
}