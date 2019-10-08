module.exports = {
	help: "Create, delete, edit, add, and remove roles.",
	usage: [" - shows this help",
			" create [role name] - creates new role",
			" delete [role name] - deletes existing role",
			" edit [role name] [color/name/etc] [new value] - edits existing role",
			" add [comma, separated, role names] [@memberping] - adds roles to specified member",
			" remove [comma, separated, role names] [@memberping] - removes roles from specified member"],
	examples: ["hh!adrole create this role",
			   "hh!adrole delete this role",
			   "hh!adrole edit this role color #FF0000",
			   "hh!adrole add this role @thatperson",
			   "hh!adrole remove this role @thatperson"
			  ],
	subcommands: {},
	alias: ["adroles"],
	guildOnly: true,
	permissions: ["manageRoles"],
	module: "admin"
}

module.exports.subcommands.add = {
	help: "Add roles to mentioned users.",
	usage: [" [roles, to, add] [@user,@mentions] - adds roles to these users"],
	examples: ["hh!adrole add this role @thatperson"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: "Remove roles from mentioned users.",
	usage: [" [roles, to, remove] [@user @mention] - removes roles from users"],
	examples: ["hh!adrole remove this role, that role @thatperson"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.index = {
	help: "Index new selfroles.",
	usage: [" [role name] [1/0] - Indexes new role, either self-roleable (1) or mod-roleable (0)"],
	examples: ["hh!adrole index this role 1"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.create = {
	help: "Creates a role.",
	usage: [" [role name] - creates a new role with the given name, if one doesn't already exist"],
	examples: ["hh!adrole create cool role"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.edit = {
	help: "Edits a role.",
	usage: [" [role name] color [color] - edits role's color",
				" [role name] name [new name] - edits role's name"],
	examples: ["hh!adrole edit cool role color #55aa55", "hh!adrole edit cool role name cooler role"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.id = {
	help: "Fetches the ID of a role.",
	usage: [" [role name] - returns ID of the role, if it exists"],
	examples: ["hh!adrole id cool role"],
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.delete = {
	help: "Deletes a role.",
	usage: [" [role name] - deletes given role"],
	examples: ["hh!adrole delete cool role"],
	permissions: ["manageRoles"],
	guildOnly: true
}