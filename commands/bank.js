module.exports = {
	help: ()=> "Get your current number of credits",
	usage: ()=> [" - Shows your current amount of credits"],
	execute: async (bot, msg, args) => {
		var prof = await bot.utils.getProfile(bot, msg.author.id);
		if(!prof) return msg.channel.createMessage("You don't have any credits.");
		msg.channel.createMessage({embed: {
			title: "Balance",
			description: `:dollar: ${prof.cash}`
		}})
	},
	alias: ["credits", "balance", "bal", "money", "cash"],
	module: "fun"
}