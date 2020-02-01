module.exports = {
	help: ()=> "Sets guild-specific prefix",
	usage: ()=> [" <prefix> - Sets prefix for the guild. Views current prefix and offers to delete it if no prefix is supplied"],
	execute: async (bot, msg, args) =>{
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(args[0]) {
			var scc = await bot.utils.updateConfig(bot, msg.guild.id, {prefix: args[0].toLowerCase()});
			if(scc) msg.channel.createMessage("Prefix set!");
			else msg.channel.createMessage("Something went wrong");
		} else {
			if(cfg && cfg.prefix) {
				var message = await msg.channel.createMessage(`Current prefix: ${cfg.prefix}\nWould you like to reset it?`);
				if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
					user: msg.author.id,
					index: 0,
					timeout: setTimeout(()=> {
						if(!bot.menus[message.id]) return;
						if(message.channel.guild) {
							try {
								message.removeReactions();
							} catch(e) {
								console.log(e);
							}
						}
						delete bot.menus[message.id];
					}, 900000),
					execute: async function(bot, m, e) {
						switch(e.name) {
							case "✅":
								var scc = await bot.utils.updateConfig(bot, m.guild.id, {prefix: ""});
								if(scc) {
									m.channel.createMessage("Prefix reset!");
									try {
										m.removeReactions();
									} catch(e) {
										console.log(e);
									}
								} else m.channel.createMessage("Something went wrong")
								break;
							case "❌":
								m.channel.createMessage("Action cancelled");
								break;
						}
					}
				};
				["✅","❌"].forEach(r => message.addReaction(r));
			} else msg.channel.createMessage(`No custom prefix has been registered for this server`);
		}
	},
	module: "admin",
	guildOnly: true,
	permissions: ["manageGuild"]
}