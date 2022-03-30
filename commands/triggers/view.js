module.exports = {
	data: {
		name: 'view',
		description: 'View existing trigger lists',
		options: [
			{
				name: 'list',
				description: "A specific list to view",
				type: 3,
				autocomplete: true,
				required: false
			},
			{
				name: 'user',
				description: "A user to view lists from",
				type: 6,
				required: false
			}
		]
	},
	usage: [
		"- View your trigger lists",
		"[list] - View a specific trigger list (may include others' lists!)",
		"[user] - View a user's public trigger lists"
	],
	async execute(ctx) {
		var { client: { stores } } = ctx;
		var id = ctx.options.getString('list')?.trim().toLowerCase();
		var user = ctx.options.getUser('user');
		
		var embeds;
		if(user) {
			var list = await stores.triggers.getAll(user.id);
			if(list) {
				list = list.filter(x => (
					!x.private || x.overrides?.includes(ctx.user.id)
				))
			}
			if(!list?.length) return "No trigger lists to view";
			
			embeds = await ctx.client.utils.genEmbeds(ctx.client, list, (l) => {
				return {
					name: l.name,
					value: `ID: ${l.hid}`
				}
			}, {
				title: "Trigger lists"
			})
		} else if(id) {
			var list = await stores.triggers.get(id);
			if(!list?.id) return "List not found";
			if(list.user_id != ctx.user.id) {
				if(list.private && !list.overrides?.includes(ctx.user.id))
					return "List not found"; // hide list existence
			}

			var embed = {
				title: `${list.name} (${list.hid})`,
				description: list.list
			}
			if(list.user_id == ctx.user.id) {
				embed.footer = {
					text: `This list ${list.private ? 'is' : 'is not'} private`
				}

				embed.fields = [{
					name: "Privacy overrides",
					value: (
						list.overrides?.length ?
						list.overrides.map(o => `<@${o}>`).join('\n') :
						"(none)"
					)
				}]
			} else {
				user = await ctx.client.users.fetch(list.user_id);
				embed.author = {
					icon_url: user.avatarURL(),
					name: `${user.username}#${user.discriminator}`
				}
			}

			embeds = [embed]
		} else {
			var list = await stores.triggers.getAll(ctx.user.id);
			if(!list?.length) return "No trigger lists to view";
			embeds = await ctx.client.utils.genEmbeds(ctx.client, list, (l) => {
				return {
					name: l.name,
					value: `ID: ${l.hid}`
				}
			}, {
				title: "Trigger lists"
			})
		}

		return embeds;
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
	},
	ephemeral: true
}