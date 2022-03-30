module.exports = {
	data: {
		name: 'view',
		description: "View polls and their results",
		options: [
			{
				name: 'poll',
				description: "A specific poll to view",
				type: 3,
				autocomplete: true,
				required: false
			},
			{
				name: 'query',
				description: "A query to use to search for polls",
				type: 3,
				required: false
			},
			{
				name: 'status',
				description: "A specific status (active/closed) to search for",
				type: 3,
				choices: [
					{
						name: 'active',
						value: 'active'
					},
					{
						name: 'closed',
						value: 'closed'
					}
				],
				required: false
			}
		]
	},
	usage: [
		"- View all polls opened across the server",
		"[poll] - Views a specific poll",
		"[query] - Searches for polls that match the query (name/description)",
		"[status] - Searches for polls that have a given status",
		"[query] [status] - Searches for polls that meet a specific query and have a given status"
	],
	extra: "Giving an ID will *always* override all extra arguments",
	async execute(ctx) {
		var polls = await ctx.client.stores.polls.getAll(ctx.guild.id);
		var id = ctx.options.getString('poll')?.trim().toLowerCase();
		var query = ctx.options.getString('query')?.trim().toLowerCase();
		var status = ctx.options.getString('status');
		if(!polls?.length) return "No polls to view";

		if(id) polls = polls.filter(x => x.hid == id);
		else {
			if(query) polls = polls.filter(x => (
				x.title.toLowerCase().includes(query) ||
				x.description
			))

			if(status) polls = polls.filter(x => x.active == (status == 'active' ? true : false))
		}
		if(!polls.length) return "No polls found";

		var embeds = [];
		for(var p of polls) {
			embeds.push(await p.buildEmbed())
		}

		return embeds;
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
	},
	ephemeral: true
}