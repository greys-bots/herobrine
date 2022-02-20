module.exports = {
	help: ()=> "A bit about the bot",
	usage: ()=> ["- Just what's on the tin"],
	execute: async (bot) => {
		return {embed: {
			title: "About",
			description: "Hi! I'm a bot! Beep boop\nHere's a bit about me:",
			fields: [
				{name: "Invite", value: bot.invite ? `[clicky](${bot.invite})` : "(unavailable)"},
				{name:"Creator", value: "[greysdawn](https://github.com/greysdawn) | (GS)#6969"},
				{name: "Repo", value: "[greys-bots/basebot](https://github.com/greys-bots/basebot)"},
				{name: "Stats", value: `Guilds: ${bot.guilds.cache.size} | Users: ${bot.users.cache.size}`},
				{name: "Support my creators!", value: "[Ko-Fi](https://ko-fi.com/greysdawn) | [Patreon](https://patreon.com/greysdawn)"}
			]
		}};
	},
	alias: ["abt"]
}