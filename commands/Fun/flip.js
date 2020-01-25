//- - - - - - - - - - Flip - - - - - - - - - -
module.exports = {
	help: ()=> "Flips a coin",
	usage: ()=> [' - Flips a virtual coin'],
	execute: (bot, msg, args)=>{
		msg.channel.createMessage("You flipped:\n"+(Math.floor(Math.random()*2) == 1 ? ":o:\nHeads!" : ":x:\nTails!"));
	},
	module: "utility",
	alias: ["coin", "coinflip"]
}