module.exports = {
	help: ()=> "Set a custom trigger word and response(s). NOTE: Not the same as the `trigs` command.",
	usage: ()=> [" - Lists all registered tags",
				 " add|new|create - Runs a menu to create a new trigger and responses",
				 " remove|delete [trigger] - Deletes a trigger",
				 " edit [trigger] - Runs a menu to edit a trigger"],
	execute: async (bot, msg, args) => {
		var tags = await bot.utils.getTags(bot, msg.guild.id);
		if(tags) {
			
		} else {
			msg.channel.createMessage("No tags registered");
		}
	},
	alias: ["tag","response","responses"]
}