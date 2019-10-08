module.exports = {
	help: "Set a custom command alias for the server",
	usage: [" - View registered aliases",
			" add <name> <command> - Add a new alias. Runs a menu if sent with no arguments",
			" remove [name] - Remove an alias",
			" edit [name] - Runs a menu to edit an alias"],
	examples: ["hh!al add iam role add","hh!al add iamnot role remove", "hh!al remove iam", "hh!al add", "hh!al edit iam", "hh!al"],
	subcommands: {},
	alias: ["aliases", "al"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

module.exports.subcommands.add = {
	help: "Add a new alias",
	usage: [" - Runs a menu to add an alias", " <name> <command> - Fast way to add an alias"],
	examples: ["hh!alias add", "hh!aliad add t test"],
	alias: ["register", "a"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

module.exports.subcommands.remove = {
	help: "Removes an alias",
	usage: [" [name] - Removes a registered alias"],
	examples: ["hh!alias remove t"],
	alias: ["rem", "rmv", "unregister"],
	guildOnly: true,
	permissions: ["manageGuild"]
}

module.exports.subcommands.edit = {
	help: "Edit an alias",
	usage: [" [name] - Edit the given alias. Runs a menu for it"],
	examples: ["hh!alias edit t"],
	guildOnly: true,
	permissions: ["manageGuild"]
}