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

		return {embed: {
			author: {
				name: `Owned by: ${owner.username}#${owner.discriminator} (${owner.id})`,
				icon_url: owner.avatarURL
			},
			title: msg.guild.name,
			description: `ID: ${msg.guild.name}`,
			fields: [
				{name: `Channels (${msg.guild.channels.size} total)`, value: `${text} Text | ${voice} Voice | ${categories} Categories`},
				{name: `Members (${msg.guild.memberCount} total)`, value: `${humans} Non-bots | ${bots} Bots`},
				{name: `Roles (${msg.guild.roles.size} total)`, value: roles}
			],
			thumbnail: {
				url: msg.guild.iconURL
			},
			footer: {
				text: `Created: ${bot.formatTime(new Date(msg.guild.createdAt))}`
			}
		}}
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
		var embeds = [];
		var roles = msg.guild.roles.map(r => r).sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : (b.name.toLowerCase() > a.name.toLowerCase() ? -1 : 0));
		if(!roles || !roles[0]) return"No roles have been created in this server.";
		for(var i = 0; i < roles.length; i++) {
			var selfrole = await bot.stores.roles.get(msg.guild.id, roles[i].id);
			var assignable;
			if(selfrole) assignable = selfrole.assignable ? "Yes" : "No";
			else assignable = "Not indexed";
			var perms = roles[i].permissions.json;

			embeds.push({embed: {
				title: "Role Info",
				fields: [
					{name: "Name", value: roles[i].name},
					{name: "ID", value: roles[i].id},
					{name: "Color", value: roles[i].color ? roles[i].color.toString(16) : "(no color)"},
					{name: "Self Assignable?", value: assignable},
					{name: "Pingable?", value: roles[i].mentionable ? "Yes" : "No"},
					{name: "Hoisted?", value: roles[i].hoist ? "Yes" : "No"},
					{name: "Allowed Permissions", value: Object.keys(perms).filter(x => perms[x]).join(", ") || "(none)"},
					{name: "Disallowed Permissions", value: bot.strings.permission_nodes.filter(x => !perms[x]).join(", ") || "(none)"}
				],
				color: roles[i].color
			}});
		}

		if(embeds.length > 1) for(var i = 0; i < embeds.length; i++) embeds[i].embed.title += ` (page ${i+1}/${embeds.length})`;

		return embeds;
	},
	alias: ["rl", "r", "rls"],
	guildOnly: true
}