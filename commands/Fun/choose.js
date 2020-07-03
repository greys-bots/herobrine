module.exports = {
	help: ()=> "Choose between two or more options",
	usage: ()=> [" [option 1] | [option 2] | ... - Chooses between the given options"],
	execute: async (bot, msg, args) => {
		var nargs = args.join(" ").split(/\s*\|\s*/g);
		console.log(nargs);
		if(nargs.length < 2 || (nargs.length == 2 && nargs[1] == "")) return msg.channel.createMessage("Please provide at least two options to choose from");

		var choice = bot.utils.randomText(nargs);
		var rand = bot.utils.randomText(bot.strings.choices);
		return `${bot.strings.thinkemote} | ${rand.replace("$CHOICE", `**${choice}**`)}`;
	},
	alias: ["choice", "chose", "pick"],
	module: "fun"
}