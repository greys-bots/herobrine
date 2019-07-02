module.exports = {
	help: "Sets guild-specific prefix.",
	usage: [ "[prefix] - Sets prefix for the guild"],
	examples: ["hh!prefix h!"],
	module: "admin",
	guildOnly: true,
	permissions: ["manageGuild"]
}
