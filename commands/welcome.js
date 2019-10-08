module.exports = {
	help: "Used to edit server welcoming protocol",
	usage: [" enable - enables welcome protocol",
				" disable - disables welcome protocol",
				" channel <channel> - [re]sets welcome channel",
				" autoroles [comma, separated, role names] - default roles to add to members",
				" message [message goes here] - sets welcome message (use `hh!help admin welcome message` for more info"],
	examples: ["hh!welc enable",
				"hh!welc disable",
				"hh!welc chan welcome-place",
				"hh!welc autoroles this role, that role",
				"hh!welc msg Welcome, $MEMBER.MENTION!"],
	subcommands: {},
	guildOnly: true,
	alias: ["welc"],
	module: "admin",
	permisions: ["manageGuild"]
}

module.exports.subcommands.channel = {
	help: "Sets (or resets) welcome channel.",
	usage: [" <channel> - sets welcome channel to this, or resets if nothing's given. accepts mention, name, and ID"],
	examples: ["hh!welc chan welcome-wagon"],
	guildOnly: true,
	alias: ["chan"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.message = {
	help: "Sets (or resets) welcome message.<br/>"+
				["**Defined Vars**",
				"$MEMBER.MENTION = mentions the member who joined",
				"$MEMBER.NAME = gives the member's name and discriminator",
				"$MEMBER.ID = gives the member's ID",
				"$GUILD.NAME = gives the guild's name",
				"*Vars should be in all caps*"].join("\n"),
	usage: [" <new message> - sets welcome message to this, or resets if nothing's given"],
	examples: ["hh!welc msg Welcome to $GUILD.NAME, $MEMBER.MENTION!"],
	guildOnly: true,
	alias: ["msg"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.enable = {
	help: "Enables welcome protocol.",
	usage: [" - enables welcome protocol"],
	examples: ["hh!welc enable"],
	guildOnly: true,
	alias: ["e","1"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.disable = {
	help: "Disables welcome protocol.",
	usage: [" - disables welcome protocol"],
	examples: ["hh!welc disable"],
	guildOnly: true,
	alias: ["d","0"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.preroles = {
	help: "Add roles to be added when users join the server.",
	usage: [" [roles, to, add] - [Re]sets autoroles for the server. Accepts names and IDs"],
	examples: ["hh!welc autorole newbie"],
	guildOnly: true,
	alias: ["autoroles","autorole"],
	permissions: ["manageRoles","manageGuil"]
}

module.exports.subcommands.postroles = {
	help: "Sets a list of roles to add to members after they're welcomed.",
	usage: [" [roles, to, index] - Indexes roles to be added after using `hh!welcome [member]`"],
	examples: ["hh!welc postrole welcomed, cool kid"],
	guildOnly: true,
	permissions: ["manageRoles","manageGuild"],
	alias: ["postrole","welcomerole","welcomeroles","welcroles","welcrole"]
}
