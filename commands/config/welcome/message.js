module.exports = {
	data: {
		name: 'message',
		description: "Set the welcome message to be sent when a user joins the server",
		options: [{
			name: 'message',
			description: "The message to set",
			type: 3,
			required: true
		}]
	},
	usage: [
		"[message] - Sets the welcome message"
	],
	extra: "Certain variables can be used in the message!",
	async execute(ctx) {
		var message = ctx.options.getString('message').trim();
		var config = await ctx.client.stores.welcomeConfigs.get(ctx.guild.id);

		config.message = message;
		await config.save();

		return "Config updated!";
	}
}