module.exports = {
	data: {
		name: 'create',
		description: 'Create a new note',
		type: 1,
		options: [
			{
				name: 'title',
				description: 'The title of the note',
				type: 3,
				required: true
			},
			{
				name: 'body',
				description: 'The text of the note',
				type: 3,
				required: true
			}
		]
	},
	async execute(ctx) {
		var title = ctx.options.getString('title')?.trim();
		var body = ctx.options.getString('body')?.trim();

		var note = await ctx.client.stores.notes.create(ctx.user.id, {title, body});
		return `Note created! ID: ${note.hid}`;
	}
}