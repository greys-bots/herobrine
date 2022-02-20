const PINGS = ["Pong", "Pang", "Peng", "Pung"];

module.exports = {
	help: ()=> "Ping the bot",
	usage: ()=> ["- Sends a random ping message"],
	execute: async (bot, msg, args) => {
		return PINGS[Math.floor(Math.random()*PINGS.length)] + "!";
	}
}