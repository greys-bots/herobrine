module.exports = {
	help: "Disables a command/module or a command's subcommands.",
	usage: [" [command/module] <subcommand> - disables given command or its subcommand",
				" view - Lists disabled commands"],
	examples: ["hh!disable admin", "hh!disable adrole index"],
	guildOnly: true,
	subcommands: {},
	alias: ["disabled","dis"],
	module: "admin",
	permissions: ["manageGuild"]
}

module.exports.subcommands.view = {
	help: ()=> "View currently disabled commands and modules.",
	usage: ()=> [" - Views the disabled config for the server"],
	examples: ["hh!disabled view"]
}