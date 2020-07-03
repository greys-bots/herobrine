module.exports = {
	help: ()=> "Get your current number of credits",
	usage: ()=> [" - Shows your current amount of credits"],
	execute: async (bot, msg, args) => {
		var prof = await bot.stores.profiles.get(msg.author.id);
		if(!prof) return "You don't have any credits.";
		return {embed: {
			title: "Balance",
			description: `:dollar: ${prof.cash}`,
			color: parseInt('55aa55', 16)
		}}
	},
	alias: ["credits", "balance", "bal", "money", "cash"],
	module: "fun"
}