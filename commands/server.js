module.exports = {
	help: ()=> "Get info about the server",
	usage: ()=> [" - Shows server stats and info"],
	execute: async (bot, msg, args) => {
		var owner = msg.guild.members.find(m => m.id == msg.guild.ownerID);
		var text = msg.guild.channels.filter(c => c.type == 0).length;
		var voice = msg.guild.channels.filter(c => c.type == 2).length;
		var categories = msg.guild.channels.filter(c => c.type == 4).length;
		var humans = msg.guild.members.filter(m => !m.bot).length;
		var bots = msg.guild.members.filter(m => m.bot).length;
		var roles = msg.guild.roles.size <= 10 ? msg.guild.roles.map(r => `${r.name} (${r.id})`).join("\n") : "Use `hh!server roles` to view this server's roles";  
		await msg.channel.createMessage({embed: {
			author: {
				name: `Owned by: ${owner.username}#${owner.discriminator} (${owner.id})`,
				icon_url: owner.avatarURL
			},
			title: msg.guild.name,
			description: `ID: ${msg.guild.name}`,
			fields: [
				{name: `Channels (${msg.guild.channels.length} total)`, value: `${text} Text | ${voice} Voice | ${categories} Categories`},
				{name: `Members (${msg.guild.memberCount} total)`, value: `${humans} Non-bots | ${bots} Bots`},
				{name: `Roles (${msg.guild.roles.size} total)`, value: roles}
			],
			thumbnail: {
				url: msg.guild.iconURL
			},
			footer: {
				text: `Created: ${bot.formatTime(new Date(msg.guild.createdAt))}`
			}
		}})
	},
	subcommands: {},
	alias: ["srv"],
	guildOnly: true,
	module: "utility"
}

module.exports.subcommands.roles = {
	help: ()=> "Get a list of roles for the server",
	usage: ()=> [" - Sends a list of roles and their info"],
	execute: async (bot, msg, args) => {
		console.log(msg.guild.roles.map(r => r))
		if(msg.guild.roles.size > 10) {
			var embeds = await bot.utils.genEmbeds(bot, msg.guild.roles.map(r => r), async r => {
				return {name: `${r.name} (${r.id})`, value: `Pingable? ${r.mentionable}\nHoisted? ${r.hoist}\nColor: ${r.color ? "#"+r.color.toString(16) : "(none)"}`}
			}, {
				title: "Server Roles",
				description: `Total: ${msg.guild.roles.size}`,
			}, 5);

			msg.channel.createMessage(embeds[0]).then(message => {
				if(!bot.menus) bot.menus = {};
					bot.menus[message.id] = {
					user: msg.author.id,
					index: 0,
					data: embeds,
					timeout: setTimeout(()=> {
						if(!bot.menus[message.id]) return;
						message.removeReaction("\u2b05");
						message.removeReaction("\u27a1");
						message.removeReaction("\u23f9");
						delete bot.menus[message.id];
					}, 900000),
					execute: bot.utils.paginateEmbeds
				};
				message.addReaction("\u2b05");
				message.addReaction("\u27a1");
				message.addReaction("\u23f9");
			})
		} else {
			await msg.channel.createMessage({embed: {
				title: "Server Roles",
				description: `Total: ${msg.guild.roles.size}`,
				fields: msg.guild.roles.map(r => {
					return {name: `${r.name} (${r.id})`, value: `Pingable? ${r.mentionable}\nHoisted? ${r.hoist}\nColor: ${r.color ? "#"+r.color.toString(16) : "(none)"}`}
				})
			}})
		}
	},
	alias: ["rl", "r", "rls"],
	guildOnly: true
}