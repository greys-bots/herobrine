const strings = require('../../strings');

module.exports = {
	data: {
		name: 'create',
		description: "Create a new poll",
		options: [
			{
				name: 'name',
				description: "The name of the poll",
				type: 3,
				required: true
			},
			{
				name: 'description',
				description: "The description of the poll",
				type: 3,
				required: false
			},
			{
				name: 'multi-vote',
				description: "Whether users can vote for multiple options",
				type: 5,
				required: false
			}
		]
	},
	usage: [
		"[name] <description> - Create a new poll",
		"[name] multi-vote: true - Create a poll that allows users to vote for multiple options"	
	],
	async execute(ctx) {
		var title = ctx.options.getString('name').trim();
		var description = ctx.options.getString('description')?.trim();
		var multi = ctx.options.getBoolean('multi-vote') ?? false;

		await ctx.reply({
			content: 'Enter the options for your poll, separated on new lines' +
			'\nNote that the max number of options is 10,' +
			' with a max of 100 characters each',
			ephemeral: true
		});

		var resp = await ctx.channel.awaitMessages({
			filter: m => m.author.id == ctx.user.id,
			max: 1,
			time: 5 * 60 * 1000
		})
		if(!resp?.first()) return "Action cancelled";
		var options = resp.first().content.split('\n');

		var choices = options.map(o => ({option: o, voters: []}));

		await resp.first().delete();
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
			return 'Error:\n' + e;
		}
		
		var pdata = {
			embeds: [{
				title,
				description,
				color: parseInt("55aa55", 16),
				fields: choices.map((c, i) => ({
					name: `${strings.pollnumbers[i+1]} ${c.option}`, 
					value: `0 votes`
				})),
				footer: {
					text: `ID: ${poll.hid}`
				},
				author: {
					name: `${ctx.user.username}#${ctx.user.discriminator}`,
					icon_url: `${ctx.user.avatarURL()}`
				},
				timestamp: date.toISOString()
			}]
		}

		var components = [{
			type: 1,
			components: strings.pollButtons.map(b => ({
				...b,
				custom_id: `poll-${poll.hid}-${b.custom_id}`
			}))
		}]
		
		pdata.components = components;
		var pollmsg = await ctx.channel.send(pdata);
		console.log(pollmsg.id)
		poll.message_id = pollmsg.id;
		await poll.save();

		await ctx.editReply('Poll created!')
	},
	guildOnly: true
}