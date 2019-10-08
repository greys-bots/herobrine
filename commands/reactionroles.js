
module.exports = {
	help: "Sets, views, or edits reaction roles for the server",
	usage: [" - Views available reaction role configs",
				 " add [role] [emoji] (new line) <description> - Creates a new reaction role config, description optional (NOTE: to allow multi-word role names, all other arguments must be separated by a new line)",
				 " delete [role] - Removes an existing reaction role config",
				 " emoji [role] [newemoji] - Changes the emoji for an existing reaction role",
				 " description [role] (new line) [new description] - Changes the description for an existing reaction role (NOTE: description must be on a new line)"
				],
	examples: ["ha!rr", "ha!rr add cool peeps :white_check_mark:", "ha!rr delete cool peeps"],
	alias: ['rr', 'reactroles', 'reactrole', 'reactionrole'],
	subcommands: {},
	permissions: ["manageRoles"]
}

module.exports.subcommands.add = {
	help: "Adds a new reaction role. The emoji can be a custom one as long as it's in the same server",
	usage: [" [role] [emoji] (new line) <description> - Creates a new reaction role config (NOTE: if emoji is custom, must be in the same server as the bot)"],
	examples: ["ha!rr add Cool Role :white_check_mark:", "ha!rr add Another Cool Role :star:<br/>A neater role than the last"],
	alias: ['create', 'new'],
	permissions: ["manageRoles"]
}

module.exports.subcommands.remove = {
	help: "Removes a reaction role config",
	usage: [" [role] - Removes config for the role (NOTE: roles that are deleted automatically have their config removed when posting or listing configs"],
	examples: ["ha!rr delete Cool Role"],
	alias: ['delete'],
	permissions: ["manageRoles"]
}

module.exports.subcommands.bind = {
	help: "Binds a reaction role to a certain message.",
	usage: [" [role name] [channel] [messageID] - Binds a role to the message"],
	examples: ["ha!rr bind Cool Role rules 51469106810"],
	permissions: ["manageRoles"]
}

module.exports.subcommands.emoji = {
	help: "Changes emoji for a role",
	usage: [" [role] [emoji] - Changes emoji for the given role"],
	examples: ["ha!rr emoji Cool Role :star2:"],
	permissions: ["manageRoles"]
}

module.exports.subcommands.description = {
	help: "Changes description for a role",
	usage: [" [role] (new line) [description] - Changes description for the given role"],
	examples: ["ha!desc Cool Role<br/>The lesser, but still cool, cool role"],
	alias: ["describe", "desc"],
	permissions: ["manageRoles"]
}