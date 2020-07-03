module.exports = {
	help: ()=> "Pauses execution. Only the bot owner can do this.",
	usage: ()=> [" - Pauses execution until the restart command is given"],
	execute: (bot, msg, args)=>{
		if(!bot.cfg.accepted_ids.includes(msg.author.id))
			return "Only the bot owner can use this command.";

		bot.paused = true;
		return "Paused.";
	},
	module: "owner"
}