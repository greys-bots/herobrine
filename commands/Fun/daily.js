module.exports = {
	help: ()=> "Get your daily points",
	usage: ()=> [" - Gives you $150"],
	execute: async (bot, msg, args) => {
		var prof = await bot.stores.profiles.get(msg.author.id);
		if(new Date() - prof.daily < 24*60*60*1000)
			return "You've already gotten your daily for today!";
		try {
			prof = await bot.stores.profiles.update(msg.author.id, {cash: parseInt(prof.cash) + 150, daily: new Date()});
		} catch(e) {
			return "ERR: "+e;
		}

		return "You've been given 150 bucks!";
	},
	module: "fun"
}