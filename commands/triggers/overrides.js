const { clearBtns: BTNS } = require('../../extras.js');

module.exports = {
	data: {
		name: 'overrides',
		description: "Set privacy overrides for a trigger list",
		options: [
			{
				name: 'list',
				description: "The list to edit",
				type: 3,
				autocomplete: true,
				required: true
			},
			{
				name: 'action',
				description: "The action for editing the override list",
				type: 3,
				choices: [
					{
						name: 'add',
						value: 'add'
					},
					{
						name: 'remove',
						value: 'remove'
					},
					{
						name: 'clear',
						value: 'clear'
					}
				],
				required: true
			},
			{
				name: 'user',
				description: "The ID of a user to add/remove",
				type: 3,
				required: false
			}
		]
	},
	async execute(ctx) {
		var id = ctx.options.getString('list').trim().toLowerCase();
		var list = await ctx.client.stores.triggers.get(id);
		if(!list?.id || list.user_id != ctx.user.id)
			return "List not found";

		var action = ctx.options.getString('action');
		var uid = ctx.options.getString('user')?.trim().replace(/[<@!>]/, '');
		if(!list.overrides) list.overrides = [];

		if(uid) {
			try {
				await ctx.client.users.fetch(uid);
			} catch(e) {
				return "User not found";
			}
		}

		var msg;
		switch(action) {
			case 'add':
				if(!uid) return "Must provide a user ID";
				if(list.overrides.includes(uid))
					return "User already added to overrides";

				list.overrides.push(uid);
				msg = "List updated!";
				break;
			case 'remove':
				if(!uid) return "Must provide a user ID";
				if(!list.overrides.includes(uid))
					return "User not currently part of overrides";

				list.overrides = list.overrides.filter(x => x !== uid);
				msg = "List updated!";
				break;
			case 'clear':
				var m = await ctx.reply({
					content: "Are you **sure** you want to clear ALL overrides? " +
						"This can't be undone!",
					components: [{
						type: 1,
						components: BTNS
					}],
					fetchReply: true
				});
				var conf = await ctx.client.utils.getConfirmation(
					ctx.client,
					m,
					ctx.user
				);
				if(conf.msg) return conf.msg;

				list.overrides = [];
				msg = "Overrides cleared!";
				break;
		}

		await list.save();
		return msg;
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