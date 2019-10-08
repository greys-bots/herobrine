module.exports = {
	help: "Evaluate javascript code. NOTE: only the bot owner can use this command",
	usage: [" [code] - Evaluates given code."," prm [code] - Evaluates given code, and any returned promises."],
	examples: ["hh!eval 2 + 2"],
	module: "admin",
	subcommands: {}
}

module.exports.subcommands.prm = {
	help: "Evaluates something that returns a promise.",
	usage: [" [code] - evaluate the code"],
	examples: ["hh!eval p `code...`"],
	alias: ["p","prom"]
}