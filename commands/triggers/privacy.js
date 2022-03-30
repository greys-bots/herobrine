module.exports = {
	data: {
		name: 'privacy',
		description: "Edit privacy settings for a trigger list",
		options: [
			{
				name: 'list',
				description: "The list to edit",
				type: 3,
				autocomplete: true,
				required: true
			},
			{
				name: 'value',
				description: "The privacy value to set",
				type: 3,
				choices: [
					{
						name: 'private',
						value: 'private'
					},
					{
						name: 'public',
						value: 'public'
					}
				],
				required: true
			}
		]
	},
	usage: [
		"[list] [value] - Set the privacy value for a trigger list"
	],
	async execute(ctx) {
		var id = ctx.options.getString('list').trim().toLowerCase();
		var list = await ctx.client.stores.triggers.get(id);
		if(!list?.id || list.user_id != ctx.user.id)
			return "List not found";

		var val = ctx.options.getString('value');
		list.private = (val == 'private');
		await list.save();

		return "List updated!";
	},
	async auto(ctx) {
		var list = await ctx.client.stores.triggers.getAll(ctx.guild.id);
		var foc = ctx.options.getFocused()?.toLowerCase().trim();
		if(!list?.length) return [];
		if(foc) {
			list = list.filter(x =>
				x.hid.includes(foc) ||
				x.name.toLowerCase().includes(foc)
			)
		}

		return list.map(x => ({
			name: x.name,
			value: x.hid
		}))
	}
}