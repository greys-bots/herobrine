var Texts = require("../strings.json");

//- - - - - - - - - - Press F - - - - - - - - - -
module.exports = {
	help: ()=> "Presses F.",
	usage: ()=> [" - sends a random F emoji"],
	execute: (bot, msg, args)=>{
		msg.channel.createMessage(Texts.pressf[Math.floor(Math.random()*Texts.pressf.length)]);
	},
	alias:["f"]
}