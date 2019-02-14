var config = require("../config.json");
var Util = require("../utilities");

//- - - - - - - - - - Eval - - - - - - - - - -
module.exports = {
	help: ()=>"Evaluate javascript code.",
	usage: ()=>[" [code] - Evaluates given code."," prm [code] - Evaluates given code, and any returned promises."],
	desc: ()=>"Only the bot owner can use this command.",
	execute: (bot, msg, args)=>{
		if(!config.accepted_ids.includes(msg.author.id)){ return msg.channel.createMessage("Only the bot owner can use this command."); }
		try {
			const toeval = args.join(" ");
			let evld = eval(toeval);

			if(typeof(evld)!=="string"){
				evld=require("util").inspect(evld);
			}

			msg.channel.createMessage(Util.cleanText(evld));
		} catch (err) {
			if(err){console.log(err)}
		};
	},
	module: "admin",
	subcommands: {}
}

module.exports.subcommands.prm = {
	help: ()=> "Evaluates something that returns a promise.",
	usage: ()=> [" [code] - evaluate the code"],
	execute: (bot, msg, args)=>{
		if(!config.accepted_ids.includes(msg.author.id)){ return msg.channel.createMessage("Only the bot owner can use this command."); }
		async function f(){

			try {
				const promeval = args.join(" ");
				let evlp = await eval(promeval);

				if(typeof(evlp)!=="string"){
					evlp=require("util").inspect(evlp);
				}

				msg.channel.createMessage(Util.cleanText(evlp));
			} catch (err) {
				if(err){console.log(err)}
			}

		}

		f();
	},
	alias: ["p","prom"]
}