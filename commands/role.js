module.exports = {
	help: "Add and remove self roles.",
	usage: [" - display this help text",
			"s - list available roles",
			" add [comma, separated roles] - add given roles",
			" remove [comma, separated, roles] - removes given roles"],
	examples: ["hh!role add this role, that role, another role", 
				"hh!role remove that role", 
				"hh!roles", 
				"hh!role list"],
	module: "utility",
	subcommands: {},
	guildOnly: true,
	alias: ["roles"]
}

module.exports.subcommands.list = {
	help: "Lists available roles for a server.",
	usage: [" - Lists all selfroles for the server"],
	examples: ["hh!role list"]
}

module.exports.subcommands.remove = {
	help: "Removes selfroles.",
	usage: [" [comma, separated, role names] - Removes given roles, if applicable"],
	examples: ["hh!role remove this role, that role"]
}

module.exports.subcommands.add = {
	help: "Adds selfroles.",
	usage: [" [comma, separated, role names] - Adds given roles, if available"],
	examples: ["hh!role add that role, another role"]
}
