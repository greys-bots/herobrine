module.exports = {
	help: ()=> "Presses F.",
	usage: ()=> [" - sends a random F emoji"],
	execute: (bot, msg, args)=>{
		return bot.strings.pressf[Math.floor(Math.random()*bot.strings.pressf.length)];
	},
	alias:["f"],
	module: "fun"
}