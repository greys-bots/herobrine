module.exports = {
	help: ()=> "Emojify a string of letters or numbers",
	usage: ()=> [" [words/numbers/etc] - Turns the given phrase into emoji"],
	execute: async (bot, msg, args) => {
		var words=[];
		for(var x=0;x<args.length;x++){
			var chars=args[x].toLowerCase().split("");
			var emotes=[];
			for(var n=0;n<chars.length;n++){
				if(bot.strings.emoji[chars[n]]) emotes.push(bot.strings.emoji[chars[n]]);

			}
			if(emotes.length>1){
				words.push(emotes.join(" "));
			} else {
				words.push(emotes)
			}
		}

		if(words.join("   ").length < 2000) return words.join("   ");
		else return "That message is too long to be emojified";
	},
	module: "fun"
}