//- - - - - - - - - - Pings - - - - - - - - - -

module.exports = {
	help: ()=> "Ping the Boy:tm:",
	usage: ()=> [" - Returns a random pingy-pongy response."],
	execute: (bot, msg, args)=>{
		var pongs = ["pong!","peng!","pung!","pang!"];
		msg.channel.createMessage(pongs[Math.floor(Math.random()*pongs.length)]);
	},
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