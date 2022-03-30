module.exports = {
	data: {
		name: 'view',
		description: 'View your existing notes',
		type: 1,
		options: [
			{
				name: 'note',
				description: "The note to view",
				type: 3,
				required: false,
				autocomplete: true
			},
			{
				name: 'raw',
				description: "Whether to view a specific note's raw body",
				type: 5,
				required: false
			}
		]
	},
	usage: [
		"- View all notes",
		"[note] - View a specific note"
	],
	async execute(ctx) {
		var id = ctx.options.getString('note')?.trim().toLowerCase();
		var notes = await ctx.client.stores.notes.getAll(ctx.user.id);
		if(!notes?.length) return 'No notes available';
		if(id) notes = notes.filter(x => x.hid == id);
		if(!notes.length) return "No note found!";
		var raw = ctx.options.getBoolean('raw');


		var embeds;
		if(raw) {
			if(!id) return "Can only view the raw body for individual notes";

			return (
				'```\n' +
				notes[0].body +
				'\n```'
			)
		} else {
			embeds = notes.map(n => ({
				title: n.title,
				description: n.body,
				footer: { text: n.hid }
			}))

			if(embeds.length > 1) {
				for(var i = 0; i < embeds.length; i++)
					embeds[i].title += ` (page ${i + 1}/${embeds.length})`
			}

			return embeds;
		}
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
	ephemeral: true
}