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
	usage: [
		"[title] [body] - Create a new note"	
	],
	async execute(ctx) {
		var title = ctx.options.getString('title').trim();
		var body = ctx.options.getString('body').trim();

		try {
			var note = await ctx.client.stores.notes.create(ctx.user.id, {title, body});
		} catch(e) {
			return 'Error:\n' + e;
		}
		
		return `Note created! ID: ${note.hid}`;
	}
}