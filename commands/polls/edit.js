module.exports = {
	data: {
		name: 'edit',
		description: "Edit the title or description of a poll",
		options: [
			{
				name: 'poll',
				description: "The poll to edit",
				type: 3,
				autocomplete: true,
				required: true
			}
		]
	},
	usage: [
		"[poll] - Edit a poll's properties"
	],
	async execute(ctx) {
		var id = ctx.options.getString('poll').trim().toLowerCase();
		var poll = await ctx.client.stores.polls.get(ctx.guild.id, id);
		if(!poll?.id) return "Poll not found";

		var mdata = {
			title: "Create a new poll",
			custom_id: `poll-edit-${ctx.user.id}`,
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
						value: poll.title,
						required: true	
					}]
				},
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'description',
						label: "Description",
						style: 1,
						max_length: 2000,
						placeholder: "Enter a description",
						value: poll.description,
						required: false
					}]
				}
			]
		}

		var mod = await ctx.client.utils.awaitModal(ctx, mdata, ctx.user)
		if(!mod) return;
		
		var title = mod.fields.getField('title').value.trim().toLowerCase();
		var description = mod.fields.getField('description')?.value?.trim();

		poll.title = title;
		poll.description = description;
		await poll.save(true);
		await mod.followUp("Poll updated!");
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