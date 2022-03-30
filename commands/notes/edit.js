module.exports = {
	data: {
		name: 'edit',
		description: "Edit an existing notes",
		options: [
			{
				name: 'note',
				description: "The note to edit",
				type: 3,
				autocomplete: true,
				required: true
			}
		]
	},
	usage: [
		"- Edit a note's properties"	
	],
	async execute(ctx) {
		var id = ctx.options.getString('note').trim().toLowerCase();
		var note = await ctx.client.stores.notes.get(ctx.user.id, id);
		if(!note?.id) return "Note not found";

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
						value: note.title,
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
						value: note.body,
						required: true
					}]
				}
			]
		}

		var mod = await ctx.client.utils.awaitModal(ctx, mdata, ctx.user)
		if(!mod) return;
		
		var title = mod.fields.getField('title').value.trim();
		var body = mod.fields.getField('body').value.trim();

		note.title = title;
		note.body = body;
		await note.save()
		await mod.followUp("Note edited!");
	},
	async auto(ctx) {
		var notes = await ctx.client.stores.notes.getAll(ctx.user.id);
		var foc = ctx.options.getFocused();
		if(!notes?.length) return [];
		if(!foc) return notes.map(n => ({
			name: n.title,
			value: n.hid 
		}));
		foc = foc.toLowerCase().trim();

		return notes.filter(n =>
			n.hid.includes(foc) ||
			n.title.toLowerCase().includes(foc)
		).map(n => ({
			name: n.title,
			value: n.hid
		}))
	},
}