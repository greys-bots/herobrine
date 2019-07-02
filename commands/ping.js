module.exports = {
	help: "Ping the Boy",
	usage: [" - Returns a random pingy-pongy response."],
	examples: ["hh!ping"],
	module: "fun",
	subcommands: {},
	alias: ["ping!"]
}

module.exports.subcommands.test = {
	help: ()=> "Test the Boy:tm:",
	usage: ()=> [" - yeet"],
	execute: (bot, msg, args)=>{
		var yeets = ["yeet!","yate!","yote!","yute!", "yite!"];
		msg.channel.createMessage(yeets[Math.floor(Math.random()*yeets.length)]);
	},
	module: "fun"
}