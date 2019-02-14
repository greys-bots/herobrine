var Texts = require("../strings.json");

//- - - - - - - - - - Lovebomb - - - - - - - - - -

module.exports = {
	help: () => "Get a little bit of love from Herobrine!",
	usage: () => [" - sends about 5 messages in a row that are meant to be affirming"],
	execute: (bot, msg, args) =>{
		var lb = -1000;
		Texts.lovebombs.forEach(async t=>{
			lb+=1000;
			setTimeout(()=>{
				msg.channel.sendTyping();
			},lb)
			setTimeout(()=>{
				msg.channel.createMessage(t.replace("msg.author.username",msg.author.username));
			},lb+500)
		});
	},
	module: "fun",
	alias: ["lb","love"]
}
