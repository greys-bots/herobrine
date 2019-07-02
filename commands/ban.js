module.exports = {
	help: "[Hack]bans members. NOTE: IDs must all be on one line- use a new line to write the ban reason",
	usage: [" [space delimited IDs] (new line) [ban reason] - Bans member with that ID."],
	examples: ["hh!ban 123456789<br/>They stole my burrito :("],
	permissions: ["banMembers"],
	guildOnly: true,
	module: "admin"
}