module.exports = {
	help: "Registers channel and reaction emoji for a server pinboard.",
	usage: [" add [chanName | chanID | #channel] [:emoji:] - Adds channel and reaction config.",
				" remove [chanName | chanID | #channel] - Removes channel config.",
				" view - Views current configs."],
	examples: ["hh!ap add test-chan :pushpin:","hh!ap remove test-chan", "hh!ap view"],
	subcommands: {},
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["ap","autopins"]
}

module.exports.subcommands.add = {
	help: "Adds a channel to the server's autopin config",
	usage: [" [chanName | chanID | #channel] [:emoji:] - Adds channel and reaction config for the server."],
	examples: ["hh!ap add starboard :star:"],
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["a","new"]
}

module.exports.subcommands.remove = {
	help: "Removes a channel from the server's autopin config",
	usage: [" [chanName | chanID | #channel] - Removes the channel's pin config."],
	examples: ["hh!ap remove starboard"],
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["r","delete"]
}

module.exports.subcommands.pin = {
	help: "Takes the pins in the current channel and pins them in the pinboard",
	usage: [" [emoji] - Processes pins in the current channel."],
	examples: ["hh!ap pin :star:"],
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["pins","process"]
}

module.exports.subcommands.view = {
	help: "Views the server's autopin config",
	usage: [" - Views the server's autopin config."],
	examples: ["hh!ap view"],
	permissions: ["manageGuild"],
	guildOnly: true,
	module: "admin",
	alias: ["list","v","l"]
}

module.exports.subcommands.config = {
	help: "Show current pinboard configurations",
	usage: [" - Show current configurations"],
	examples: ["hh!ap cfg"],
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["cfg"]
}

module.exports.subcommands.tolerance = {
	help: "Set the tolerance for boards (or globally). This is the number of stars "+
	"required for a message to be added to the starboard",
	usage: [" [number] - Set global tolerance",
				 " - Reset global tolerance",
				 " [channel] [number] - Set specific tolerance",
				 " [channel] - Reset specific tolerance"],
	examples: ["hh!ap tolerance 3", "hh!ap tolerance cool-stuff 2"],
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["tol"]
}

module.exports.subcommands.override = {
	help: "Sets moderator override for adding items to the pinboard. "+
	"If this is set to true, anyone with manageMessages can automatically "+
	"add messages to the starboard by reacting, regardless of the set tolerance.",
	usage: [" [(true|1)|(false|0] - Sets the override. Use 1, true, or enable to enable, false, 0, or disable to disable"],
	examples: ["hh!ap override 1", "hh!ap override true"],
	permissions: ["manageGuild"],
	guildOnly: true
}