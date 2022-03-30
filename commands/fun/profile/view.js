module.exports = {
	data: {
		name: 'view',
		description: "View your profile or someone else's",
		type: 1,
		options: [{
			name: 'user',
			description: "A user to view the profile of",
			type: 6,
			required: false
		}]
	},
	usage: [
		'- View your own profile',
		"[user] - View another user's profile"
	],
	async execute(ctx) {
		var { client: bot } = ctx;
		var u = ctx.options.getUser('user');
		var user = u ?? ctx.user;

		var profile = await bot.stores.profiles.get(user.id);

		return {embeds: [profile.buildEmbed(user)]}
	}
}