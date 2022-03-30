module.exports = {
	data: {
		name: 'channel',
		description: "Set the channel for welcome messages",
		options: [{
			name: 'channel',
			description: "The channel to set",
			type: 7,
			channel_types: [0, 5, 10, 11, 12],
			required: true
		}]
	},
	usage: [
		'[channel] - Set the welcome message channel'
	],
	async execute(ctx) {
		var channel = ctx.options.getChannel('channel');
		var config = await ctx.client.stores.welcomeConfigs.get(ctx.guild.id);

		config.channel = channel.id;
		await config.save();

		return "Config updated!";
	}
}