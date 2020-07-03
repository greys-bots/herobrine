module.exports = {
	help: () => "Get a little bit of love from Herobrine!",
	usage: () => [" - sends about 5 messages in a row that are meant to be affirming"],
	execute: (bot, msg, args) =>{
		var lb = 0;
		bot.strings.lovebombs.forEach(async t=>{
			setTimeout(()=>{
				msg.channel.sendTyping();
			},lb)
			setTimeout(()=>{
				return t.replace("msg.author.username", msg.author.username);
			},lb+500)
			lb+=1000;
		});
	},
	module: "fun",
	alias: ["lb","love"]
}
