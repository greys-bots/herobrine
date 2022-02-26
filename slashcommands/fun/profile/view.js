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

		return {embeds: [{
			title: profile.name || "untitled user profile",
			description: profile.description || "(not set)",
			author: {
				name: user.tag,
				icon_url: user.avatarURL({format: "png", dynamic: true})
			},
			color: parseInt(profile.color, 16) || parseInt("aaaaaa", 16),
			fields: [
				{name: "Level", value: (profile.level).toString(), inline: true},
				{name: "Experience", value: (profile.exp).toString(), inline: true}
			],
			footer: {
				text: `Level-up messages ${profile.disabled ? "are" : "are not"} disabled for this user`
			}
		}]}
	}
}