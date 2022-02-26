module.exports = {
	data: {
		name: 'view',
		description: 'View your existing notes',
		type: 1,
		options: []
	},
	async execute(ctx) {
		var id = ctx.options.getString('note')?.trim().toLowerCase();
		var notes = await ctx.client.stores.notes.getAll(ctx.user.id);
		if(!notes?.length) return 'No notes available';

		return notes.map(n => ({
			title: n.title,
			description: n.body,
			footer: { text: n.hid }
		}))
	}
}