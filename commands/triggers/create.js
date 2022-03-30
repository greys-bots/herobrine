module.exports = {
	data: {
		name: 'create',
		description: "Create a new trigger list"
	},
	usage: [
		"- Create a new trigger list"
	],
	async execute(ctx) {
		var mdata = {
			title: "Create trigger list",
			custom_id: `triggers-create-${ctx.user.id}`,
			components: [
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'name',
						label: "Name",
						style: 1,
						max_length: 100,
						placeholder: "Enter a name"
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
						)
					}]
				}
			]
		}

		var mod = await ctx.client.utils.awaitModal(ctx, mdata, ctx.user)
		if(!mod) return;

		var list = await ctx.client.stores.triggers.create(ctx.user.id, {
			name: mod.fields.getField('name').value,
			list: mod.fields.getField('list').value
		})

		await mod.followUp("List created! ID: " + list.hid);
		return;
	}
}