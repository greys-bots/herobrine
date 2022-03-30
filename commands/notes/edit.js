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
			},
			{
				name: 'property',
				description: "The property to edit",
				type: 3,
				choices: [
					{
						name: 'title',
						value: 'title'
					},
					{
						name: 'body',
						value: 'body'
					}
				],
				required: true
			},
			{
				name: 'value',
				description: "The new value for the property",
				type: 3,
				required: true
			}
		]
	},
	async execute(ctx) {
		var id = ctx.options.getString('note').trim().toLowerCase();
		var prop = ctx.options.getString('property').trim().toLowerCase();
		var val = ctx.options.getString('value').trim();

		var note = await ctx.client.stores.notes.get(ctx.user.id, id);
		if(!note?.id) return "Note not found";

		note[prop] = val;
		await note.save()
		return "Note edited!";
	},
	async auto(ctx) {
		var notes = await ctx.client.stores.notes.getAll(ctx.guild.id);
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