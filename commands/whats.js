var Util = require("../utilities");
var Texts = require("../strings.json");
//- - - - - - - - - - What's up - - - - - - - - - -
module.exports = {
	help: ()=> "Return a random phrase about what's up.",
	usage: ()=>[" - Return random tidbit."],
	execute: (bot, msg, args)=>{
		if(!args[0]){ return }
		if(args[0].match(/up\?*/)){
			msg.channel.createMessage(Util.randomText(Texts.wass));
		}
	},
	module: "fun",
	alias: ["what's"]
}