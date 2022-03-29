module.exports = {
	data: {
		name: 'title',
		description: "Set your profile title",
		type: 1,
		options: [{
			name: 'title',
			description: "The title to set",
			type: 3,
			required: true
		}]
	},
	usage: [
		"[title] - Set your profile title"
	],
	async execute(ctx) {
		var { client: { stores } } = ctx;
		var title = ctx.options.getString('title').trim();
		if(title.length > 100) return "Title too long; must be 100 characters or less";

		var profile = await stores.profiles.get(ctx.user.id);
		profile.name = title;
		await profile.save();

		return "Title saved!";
	}
}