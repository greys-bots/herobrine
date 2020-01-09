module.exports = {
	help: ()=> "Return a random phrase about what's up.",
	usage: ()=>[" - Return random tidbit."],
	execute: (bot, msg, args)=>{
		if(!args[0]){ return }
		if(args[0].match(/up\?*/)){
			msg.channel.createMessage(bot.utils.randomText(bot.strings.wass));
		}
	},
	module: "fun",
	alias: ["what's"]
}