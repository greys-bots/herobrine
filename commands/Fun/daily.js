module.exports = {
	help: ()=> "Get your daily points",
	usage: ()=> [" - Gives you $150"],
	execute: async (bot, msg, args) => {
		var check = await bot.stores.profiles.checkDaily(msg.author.id);
		if(check) return "You've already gotten your daily for today!";

		try {
			await bot.stores.profiles.setDaily(msg.author.id);
		} catch(e) {
			return "ERR: "+e;
		}

		return "You've been given 150 bucks!";
	},
	module: "fun"
}