module.exports = {
	help: ()=> "Sets guild-specific prefix",
	usage: ()=> [" <prefix> - Sets prefix for the guild. Views current prefix and offers to delete it if no prefix is supplied"],
	execute: async (bot, msg, args) =>{
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(args[0]) {
			try {
				if(!cfg) await bot.stores.configs.create(msg.guild.id, {prefix: args[0].toLowerCase()});
				else await bot.stores.configs.update(msg.guild.id, {prefix: args[0].toLowerCase()});
			} catch(e) {
				return "ERR: "+e;
			}
			
			return "Prefix set!";
		}

		if(!cfg || !cfg.prefix) return 'No custom prefix has been registered for this server.';
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
						try {
							await bot.stores.configs.update(m.guild.id, {prefix: null});
						} catch(e) {
							await m.channel.createMessage("ERR: "+e);
						}
						
						await m.channel.createMessage("Prefix reset!");
						break;
					case "❌":
						await m.channel.createMessage("Action cancelled.");
						break;
				}
			}
		};
		["✅","❌"].forEach(r => message.addReaction(r));
	},
	module: "admin",
	guildOnly: true,
	permissions: ["manageGuild"]
}