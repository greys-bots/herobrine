const strings = require('../../strings');

module.exports = {
	data: {
		name: 'create',
		description: "Create a new poll",
		options: [{
				name: 'multi-vote',
				description: "Whether users can vote for multiple options",
				type: 5,
				required: false
		}]
	},
	usage: [
		"[name] <description> - Create a new poll",
		"[name] multi-vote: true - Create a poll that allows users to vote for multiple options"	
	],
	async execute(ctx) {
		var mdata = {
			title: "Create a new poll",
			custom_id: `poll-create-${ctx.user.id}`,
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
						required: false
					}]
				},
				{
					type: 1,
					components: [{
						type: 4,
						custom_id: 'choices',
						label: "Choices",
						style: 2,
						max_length: 1000,
						placeholder: (
							"Enter your choices one per line\n" +
							"Example:\n" +
							"Bats\n" +
							"Cats\n" +
							"Rats"
						),
						required: true
					}]
				}
			]
		}

		var mod = await ctx.client.utils.awaitModal(ctx, mdata, ctx.user, true)
		if(!mod) return;

		var multi = ctx.options.getBoolean('multi-vote') ?? false;
		var title = mod.fields.getField('title').value.trim();
		var description = mod.fields.getField('description')?.value?.trim();
		var options = mod.fields.getField('choices').value.trim().split('\n');

		var choices = options.map(o => ({option: o, voters: []}));

		var date = new Date();
		try {
			var poll = await ctx.client.stores.polls.create(ctx.guild.id, {
				title,
				description,
				choices,
				channel_id: ctx.channel.id,
				user_id: ctx.user.id,
				start_time: date,
				multi
			})
		} catch(e) {
			await mod.followUp('Error:\n' + e);
			return;
		}
		
		var pdata = {
			embeds: [await poll.buildEmbed()],
			components:  [{
				type: 1,
				components: strings.pollButtons.map(b => ({
					...b,
					custom_id: `poll-${poll.hid}-${b.custom_id}`
				}))
			}]
		}
		
		var pollmsg = await ctx.channel.send(pdata);
		poll.message_id = pollmsg.id;
		await poll.save();

		await mod.followUp('Poll created!')
	},
	guildOnly: true,
	ephemeral: true
}