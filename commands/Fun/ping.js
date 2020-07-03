module.exports = {
	help: ()=> "Ping the Boy:tm:",
	usage: ()=> [" - Returns a random pingy-pongy response."],
	execute: (bot, msg, args)=>{
		var pongs = ["pong!","peng!","pung!","pang!"];
		return pongs[Math.floor(Math.random()*pongs.length)];
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
		return yeets[Math.floor(Math.random()*yeets.length)];
	},
	module: "fun"
}