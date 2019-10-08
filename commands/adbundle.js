module.exports = {
	help: "Create, delete, add, remove, and get info on role bundles.",
	usage: [" create [bundle name] [0|1] - runs a creation menu. the 0 or 1 is for self-assignability",
			" delete [bundle name] - deletes a given bundle",
			" add [bundle name] [@member @ping] - adds bundle to mentioned user(s)",
			" remove [bundle name] [@member @ping] - removes bundle from mentioned user(s)",
			" info [bundle name] - gets info on an existing bundle"],
	examples: [
			   "hh!adbundle create test bundle 1",
			   "hh!adbundle delete test bundle",
			   "hh!adbundle add test bundle @thisperson @thatperson",
			   "hh!adbundle remove test bundle @thisperson @thatperson"
			  ],
	subcommands: {},
	permissions: ["manageRoles"],
	guildOnly: true,
	module: "admin",
	alias: ["adbundles"]
}

module.exports.subcommands.info = {
	help: "Displays info for a bundle.",
	usage: [" [bundle name] - shows info for given bundle"],
	examples: ["hh!adbundle info test-bundle"]
}

module.exports.subcommands.create = {
	help: "Runs a menu for creating bundles.",
	usage: [" [bundle name] [0/1] - creates a bundle with the given name and availability (1 = mod-only)"],
	examples: ["hh!adbundle create test-bundle 1"]
}

module.exports.subcommands.delete = {
	help: "Deletes a bundle.",
	usage: [" [bundle name] - deletes given bundle"],
	examples: ["hh!adbundle delete test-bundle"]
}

module.exports.subcommands.add = {
	help: "Add bundles to mentioned users.",
	usage: [" [bundle name] [@user @mentions] - adds roles to these users"],
	examples: ["hh!adbundle add test-bundle @that1user"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: "Add bundles to mentioned users.",
	usage: [" [bundle name] [@user @mentions] - adds roles to these users"],
	examples: ["hh!adbundle remove test-bundle @that1user @thatotheruser"],
	permissions: ["manageRoles"],
	guildOnly: true
}