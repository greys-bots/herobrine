const { confBtns: BTNS } = require('../../extras.js');

module.exports = {
	data: {
		name: 'delete',
		description: "Delete a trigger list",
		options: [{
			name: 'list',
			description: "The list to delete",
			type: 3,
			autocomplete: true,
			required: true
		}]
	},
	async execute(ctx) {
		var id = ctx.options.getString('list').trim().toLowerCase();
		var list = await ctx.client.stores.triggers.get(id);
		if(!list?.id || list.user_id != ctx.user.id)
			return "List not found";

		var reply = await ctx.reply({
			content: (
				"Are you **sure** you want to delete this list? " +
				"**This can't be undone!**"
			),
			components: [{
				type: 1,
				components: BTNS
			}],
			fetchReply: true
		})
		var conf = await ctx.client.utils.getConfirmation(ctx.client, reply, ctx.user);
		if(conf.msg) return conf.msg;

		await list.delete();
		return "List deleted!"
	},
	async auto(ctx) {
		var list = await ctx.client.stores.triggers.getAll(ctx.guild.id);
		var foc = ctx.options.getFocused()?.toLowerCase().trim();
		if(!list?.length) return [];
		if(foc) {
			list = list.filter(x =>
				x.hid.includes(foc) ||
				x.name.toLowerCase().includes(foc)
			)
		}

		return list.map(x => ({
			name: x.name,
			value: x.hid
		}))
	}
}