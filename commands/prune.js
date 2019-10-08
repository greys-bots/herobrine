module.exports = {
	help: "Prunes messages in a channel.",
	usage: [" <number> - deletes [number] messages from the current channel, or 100 messages if not specified",
			" -a <number> - deletes messages and sends you an archive of them",
			" -s <number> - deletes messages except pinned ones"],
	examples: ["hh!prune 100", "hh!prune -a 100", "hh!prune -s 100"],
	subcommands: {},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["delete", "purge"],
	module: "admin"
}

module.exports.subcommands.safe = {
	help: "Prunes messages in a channel, unless pinned.",
	usage: [" <number> - deletes [num] messages, or 100 if not specified"],
	examples: ["hh!prune s 100 "],
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["--s","-s","s"]
}

module.exports.subcommands.archive = {
	help: "Prunes messages in a channel and also archives them.",
	usage: [" <number> - deletes [num] messages, or 100 if not specified"],
	examples: ["hh!prune -a 100"],
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["--a","-a","a"]
}