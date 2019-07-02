module.exports = {
	help: "Disables a command/module or a command's subcommands.",
	usage: [" [command/module] <subcommand> - disables given command or its subcommand",
				" list - lists disabled commands"],
	examples: ["hh!disable admin", "hh!disable adrole index"],
	guildOnly: true,
	module: "admin",
	permissions: ["manageGuild"]
}