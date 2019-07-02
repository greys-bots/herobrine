module.exports = {
	help: "Evaluate javascript code. NOTE: only the bot owner can use this command",
	usage: [" [code] - Evaluates given code."," prm [code] - Evaluates given code, and any returned promises."],
	examples: ["hh!eval 2 + 2"],
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