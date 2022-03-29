const { confBtns } = require('../../../extras');

module.exports = {
	data: {
		name: 'delete',
		description: "Delete your profile information",
		type: 1
	},
	usage: [
		"- Completely delete your profile"
	],
	async execute(ctx) {
		var { client: { stores } } = ctx;
		var profile = await stores.profiles.get(ctx.user.id);
		if(!profile.id) return "No profile data to delete";

		var rdata = {
			content: "Are you **sure** you want to delete your profile? **This can't be undone!**",
			components: [
				{
					type: 1,
					components: confBtns
				}
			]
		}
		await ctx.reply(rdata);

		var reply = await ctx.fetchReply();
		var conf = await ctx.client.utils.getConfirmation(ctx.client, reply, ctx.user);
		if(conf.msg) return conf.msg;

		await profile.delete();
		return 'Profile deleted!';
	}
}