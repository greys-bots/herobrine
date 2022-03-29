const { confBtns: BTNS } = require('../../../extras.js');

module.exports = {
	data: {
		name: 'delete',
		description: "Delete a poll from the database",
		options: [
			{
				name: 'poll',
				description: "The poll to delete",
				type: 3,
				autocomplete: true,
				required: true
			}
		]
	},
	usage: [
		'[poll] - Delete a poll'
	],
	async execute(ctx) {
		var id = ctx.options.getString('poll').trim().toLowerCase();
		var poll = await ctx.client.stores.polls.get(ctx.guild.id, id);
		if(!poll?.id) return "Poll not found";
		if(ctx.user.id !== poll.user_id && !ctx.member.permissions.has('MANAGE_MESSAGES'))
			return "You don't have permission to delete that poll";

		var msg = await ctx.reply({
			content: "Are you **sure** you want to delete this poll? **This action can't be undone!**",
			components: [{
				type: 1,
				components: BTNS
			}],
			fetchReply: true
		});
		var conf = await ctx.client.utils.getConfirmation(ctx.client, msg, ctx.user);
		if(conf.msg) return conf.msg;

		await poll.delete();
		return "Poll deleted!";
	},
	async auto(ctx) {
		var polls = await ctx.client.stores.polls.getAll(ctx.guild.id);
		var foc = ctx.options.getFocused();
		if(!polls?.length) return [];
		if(!foc) return polls.map(p => ({
			name: p.title,
			value: p.hid 
		}));
		foc = foc.toLowerCase().trim();

		return polls.filter(p =>
			p.hid.includes(foc) ||
			p.title.toLowerCase().includes(foc)
		).map(p => ({
			name: p.title,
			value: p.hid
		}))
	}
}