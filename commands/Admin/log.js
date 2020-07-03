// still a WIP
// const logging_events = [
// 	"channelCreate"
// 	"channelDelete"
// 	"channelPinUpdate"
// 	"channelUpdate"
// 	"guildBanAdd"
// 	"guildBanRemove"
// 	"guildEmojisUpdate"
// 	"guildMemberAdd"
// 	"guildMemberRemove"
// 	"guildMemberUpdate"
// 	"guildRoleCreate"
// 	"guildRoleDelete"
// 	"guildRoleUpdate"
// 	"guildUpdate"
// 	"messageDelete"
// 	"messageDeleteBulk"
// 	"messageReactionRemoveAll"
// 	"messageUpdate"
// 	"presenceUpdate"
// 	"userUpdate"
// 	"voiceChannelJoin"
// 	"voiceChannelLeave"
// 	"voiceChannelSwitch"
// 	"voiceStateUpdate"
// 	"webhooksUpdate"
// ]

module.exports = {
	help: ()=> "Manage logging configurations for the server",
	usage: ()=> [" - List current logging configs",
				 " [channel] - Get info on an existing config",
				 " set <channel> [events] - Sets logged events for a channel. If no channel is given, sets for current one",
				 " add <channel> [events] - Adds to logged events for a channel",
				 " remove <channel> [events] - Removes from logged events for a channel",
				 " invite [name] - Get info on a saved invite",
				 " invite [invite] [name] - Save an invite under a given name",
				 " clear [channel] - Clear logging in a specific channel"],
	execute: async (bot, msg, args) => {
		return "This command is a WIP!";
		// if(args[0]) {
		// 	var channel = msg.guild.channels.find(c => c.name == args[0].toLowerCase() ||
		// 											   c.id == args[0].replace(/[<#>]/g,""));
		// 	if(!channel) return msg.channel.createMessage("Channel not found");
		// 	var config = await bot.utils.getLoggingConfig(bot, msg.guild.id, channel.id);
		// 	if(!config) return msg.channel.createMessage("That channel has no registered config");

		// 	return msg.channel.createMessage({embed: {
		// 		title: "Logging Config",
		// 		fields: [
		// 			{name: "Channel", value: channel.name},
		// 			{name: "Logged Events", value: config.events.join("\n")}
		// 		]
		// 	}})
		// }

		// var configs = await bot.utils.getLoggingConfigs(bot, msg.guild.id);
		// if(!configs || !configs[0]) return msg.channel.createMessage("No configs registered for this server");

		// var invalid = configs.map(c => !msg.guild.channels.find(ch => ch.id == c.channel_id));
		// configs = configs.filter(c => msg.guild.channels.find(ch => ch.id == c.channel_id));

		// if(configs.length == 0) {
		// 	var scc = await bot.utils.deleteLoggingConfigs(bot, msg.guild.id);
		// 	if(scc) return msg.channel.createMessage("No valid configs found, and all configs have successfully been deleted");
		// 	else return msg.channel.createMessage("No valid configs found, but none could be removed from the database");
		// }

		// var embeds = configs.map(c => {
		// 	var channel = msg.guild.channels.find(ch => ch.id == c.channel_id);
		// 	return {embed: {
		// 		title: "Logging Config",
		// 		fields: [
		// 			{name: "Channel", value: channel.name},
		// 			{name: "Logged Events", value: c.events.join("\n")}
		// 		]
		// 	}}
		// });

		// if(embeds[0]) {
		// 	var message = await msg.channel.createMessage(embeds[0]);
		// 	if(embeds[1]) {
		// 		if(!bot.menus) bot.menus = {};
		// 		bot.menus[message.id] = {
		// 			user: msg.author.id,
		// 			index: 0,
		// 			data: embeds,
		// 			timeout: setTimeout(()=> {
		// 				if(!bot.menus[message.id]) return;
		// 				try {
		// 					message.removeReactions();
		// 				} catch(e) {
		// 					console.log(e);
		// 				}
		// 				delete bot.menus[message.id];
		// 			}, 900000),
		// 			execute: bot.utils.paginateEmbeds
		// 		};
		// 		["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.addReaction(r));
		// 	}
		// } else msg.channel.createMessage("No valid configs exist");
		
		// if(invalid[0]) {
		// 	var err;
		// 	for(var i = 0; i < invalid.length; i++) {
		// 		var scc = await bot.utils.deleteLoggingConfig(bot, msg.guild.id, invalid[i].channel_id);
		// 		if(!scc) err = true;
		// 	}

		// 	if(err) msg.channel.createMessage("Some invalid configs couldn't be removed from the database");
		// 	else msg.channel.createMessage("Invalid configs have been deleted!");
		// }
	},
	alias: ["logging"],
	permissions: ["manageGuild"],
	guildOnly: true,
	subcommands: {}
}

// module.exports.subcommands.set = {
// 	help: ()=> "Set logged events for a channel",
// 	usage: ()=> [" [events] - Set logged events for the current channel",
// 				 " [channel] [events] - Set logged events for the given channel"],
// 	desc: ()=> "Channel can be a channel-name, channel ID, or #mention",
// 	execute: async (bot, msg, args) => {
// 		if(!args[0]) return msg.channel.createMessage("Please provide at least one event");

// 	}	
// }