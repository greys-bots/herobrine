module.exports = {
	help: "Add and remove role bundles.",
	usage: [" add [bundle name] - adds an available bundle to you",
				" remove [bundle name] - removes an available bundle from you"],
	examples: ["hh!bundle add test bundle","hh!bundle remove test bundle"],
	subcommands: {},
	guildOnly: true,
	module: "utility",
	alias: ["bundles"]
}

module.exports.subcommands.add = {
	help: "Adds bundle to the user.",
	usage: [" [bundle name] - adds the given bundle"],
	examples: ["hh!bundle add test-bundle"],
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: "Removes bundle from the user.",
	usage: [" [bundle name] - adds the given bundle"],
	examples: ["hh!bundle remove test-bundle"],
	guildOnly: true
}

module.exports.subcommands.info = {
	help: "Displays info for a bundle.",
	usage: [" [bundle name] - shows info for given bundle"],
	examples: ["hh!bundle info test-bundle"]
}