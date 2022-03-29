module.exports = {
	data: {
		name: 'edit',
		description: "Edit a trigger list",
		options: [{
			name: 'list',
			description: "The trigger list to edit",
			type: 3,
			autocomplete: true,
			required: true
		}]
	},
	usages: [
		"[list] - Edit a trigger list"
	],
	async execute(ctx) {
		var id = ctx.options.getString('list').trim().toLowerCase();
		var list = await ctx.client.stores.triggers.get(id);
		if(!list?.id || list.user_id != ctx.user.id)
			return "List not found";

		var mdata = {
			title: "Edit trigger list",
			custom_id: `triggers-edit-${ctx.user.id}`,
			components: [
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'name',
						label: "Name",
						style: 1,
						max_length: 100,
						placeholder: "Enter a name",
						value: list.name
					}]
				},
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'list',
						label: "Trigger list",
						style: 2,
						max_length: 2000,
						placeholder: (
							"Enter your list!\n" +
							"Example:\n" +
							"- Snakes\n" +
							"- Loud noises\n" +
							"- The Dark Lord's true name"
						),
						value: list.list
					}]
				}
			]
		}

		var mod = await ctx.client.utils.awaitModal(ctx, mdata, ctx.user)
		list.name = mod.fields.getTextInputValue('name');
		list.list = mod.fields.getTextInputValue('list');
		await list.save();

		await mod.followUp("List edited!");
		return;
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