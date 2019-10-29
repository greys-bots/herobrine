module.exports = {
	help: ()=> "Get your daily points",
	usage: ()=> [" - Gives you $150"],
	execute: async (bot, msg, args) => {
		var check = await bot.utils.checkDaily(bot, msg.author.id);
		if(check) return msg.channel.createMessage("You've already gotten your daily for today");

		var scc = await bot.utils.setDaily(bot, msg.author.id);
		if(scc) msg.channel.createMessage("You've been given 150 bucks!");
		else msg.channel.createMessage("Something went wrong");
	}
}