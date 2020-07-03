module.exports = {
	help: ()=> "Quick test command. You can use it to make sure he's up.",
	usage: ()=> [" - make Herobrine beep boop!",
				 " [words] - make Herobrine echo what you say!"],
	execute: (bot, msg, args) =>{
		if(args[0]){
			return args.join(" ");
		} else {
			return "Beep boop!";
		}
	},
	module: "fun"
};