module.exports = {
	help: ()=> "Quick test command.",
	usage: ()=> [" - make Herobrine beep boop!"," [words] - make Herobrine echo what you say!"],
	execute: (msg,args) =>{
		if(args[0]){
			msg.channel.createMessage(args.join(" "));
		} else {
			msg.channel.createMessage("Beep boop!");
		}
		
	}
};