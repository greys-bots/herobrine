const PINGS = ["Pong", "Pang", "Peng", "Pung"];

module.exports = {
	data: {
		name: 'ping',
		description: 'Ping the bot'
	},
	async execute(ctx) {
		return PINGS[Math.floor(Math.random()*PINGS.length)] + "!";
	}
}