module.exports = {
	help: "Shows your profile.",
	usage: [" - views your profile",
				" [member ID/mention] - views another user's profile",
				" edit - opens a menu for profile editing",
				" enable/disable - enables/disables level-up messages"],
	examples: ["hh!profile","hh!profile @thatguy","hh!profile edit","hh!profile enable","hh!profile disable"],
	alias: ["p","prof"],
	subcommands: {},
	guildOnly: true,
	module: "utility"
}

module.exports.subcommands.disable = {
	help: "Disables level up messages.",
	usage: [" - disables level up messages"],
	examples: ["hh!profile disable"]
}

module.exports.subcommands.enable = {
	help: "Enables level up messages.",
	usage: [" - enables level up messages"],
	examples: ["hh!profile enable"]
}

module.exports.subcommands.edit = {
	help: "Runs a menu for editing profiles.",
	usage: [" - opens an edit menu",
				" [bio/title/color] [new value] - quick edit method for your bio/title/color"],
	examples: ["hh!profile edit","hh!profile edit color #aaaaaa"]
}
