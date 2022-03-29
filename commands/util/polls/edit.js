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
						name: 'description',
						value: 'description'
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
	usage: [
		"[poll] [property] [value] - Edit a poll's properties"
	],
	async execute(ctx) {
		var id = ctx.options.getString('poll').trim().toLowerCase();
		var prop = ctx.options.getString('property').trim().toLowerCase();
		var val = ctx.options.getString('value').trim();
		var poll = await ctx.client.stores.polls.get(ctx.guild.id, id);
		if(!poll?.id) return "Poll not found";

		poll[prop] = val;
		await poll.save(true);
		return "Poll updated!";
	}
}