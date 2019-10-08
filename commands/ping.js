module.exports = {
	help: "Ping the Boy",
	usage: [" - Returns a random pingy-pongy response."],
	examples: ["hh!ping"],
	module: "fun",
	subcommands: {},
	alias: ["ping!"]
}

module.exports.subcommands.test = {
	help: "Test the Boy:tm:",
	usage: [" - yeet"],
	examples: ["hh!ping test"],
	module: "fun"
}