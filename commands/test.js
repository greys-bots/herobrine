module.exports = {
	help: ()=> "Quick test command. You can use it to make sure he's up.",
	usage: ()=> [" - make Herobrine beep boop!"," [words] - make Herobrine echo what you say!"],
	execute: (bot, msg, args) =>{
		if(args[0]){
			msg.channel.createMessage(args.join(" "));
		} else {
			msg.channel.createMessage("Beep boop!");
		}
		
	},
	module: "fun"
};