module.exports = {
	help: ()=> "Unpauses execution. Only the bot owner can do this",
	usage: ()=> [" - unpauses execution until the restart command is given"],
	execute: (bot, msg, args)=>{
		if(!bot.cfg.accepted_ids.includes(msg.author.id))
			return "Only the bot owner can use this command.";

		bot.paused = false;
		return "Unpaused.";
	},
	module: "owner"
}