module.exports = {
	data: {
		name: 'description',
		description: "Set your profile description",
		type: 1,
		options: [{
			name: 'description',
			description: "The description to set",
			type: 3,
			required: true
		}]
	},
	usage: [
		"[description] - Set your profile description"
	],
	async execute(ctx) {
		var { client: { stores } } = ctx;
		var desc = ctx.options.getString('description').trim();
		if(desc.length > 250) return "Description too long; must be 250 characters or less";

		var profile = await stores.profiles.get(ctx.user.id);
		profile.description = desc;
		await profile.save();

		return "Description saved!";
	}
}