var config = require("../config.json");
module.exports = {
	help: ()=> "Pauses execution. Only the bot owner can do this",
	usage: ()=> [" - pauses execution until the restart command is given"],
	execute: (bot, msg, args)=>{
		if(!config.accepted_ids.includes(msg.author.id)){
			msg.channel.createMessage("Only the bot owner can use this command.");
			return;
		}

		bot.paused = true;
	}
}