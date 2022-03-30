module.exports = {
	data: {
		name: 'create',
		description: 'Create a new note'
	},
	usage: [
		"- Create a new note"	
	],
	async execute(ctx) {
		var mdata = {
			title: "Create a new poll",
			custom_id: `poll-create-${ctx.user.id}`,
			components: [
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'title',
						label: "Title",
						style: 1,
						max_length: 100,
						placeholder: "Enter a title",
						required: true	
					}]
				},
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'body',
						label: "Body",
						style: 1,
						max_length: 2000,
						placeholder: "Enter a note body",
						required: true
					}]
				}
			]
		}

		var mod = await ctx.client.utils.awaitModal(ctx, mdata, ctx.user)
		if(!mod) return;
		
		var title = mod.fields.getField('title').value.trim();
		var body = mod.fields.getField('body').value.trim();

		try {
			var note = await ctx.client.stores.notes.create(ctx.user.id, {title, body});
		} catch(e) {
			await mod.followUp('Error:\n' + e);
			return;
		}
		
		await mod.followUp(`Note created! ID: ${note.hid}`);
	}
}