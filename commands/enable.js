module.exports = {
	help: "Disables a command/module or a command's subcommands.",
	usage: [" [command/module] <subcommand> - enables given command or its subcommand"],
	examples: ["hh!enable admin", "hh!enable adrole index"],
	guildOnly: true,
	module: "admin",
	permissions: ["manageGuild"]
}