module.exports = {
	help: ()=> "Change your color",
	usage: ()=> [" [color] - Change your color to the one given"],
	desc: ()=> "Colors can be hex codes or color names! Full list of names found [here](https://www.w3schools.com/colors/colors_names.asp)",
	execute: async (bot, msg, args)=> {
		var color;
		if(!args[0]) color = bot.tc(Math.floor(Math.random()*16777215).toString(16))
		else color = bot.tc(['000000','black'].includes(args.join('').toLowerCase()) ? '000001' : args.join(''));
		if(!color.isValid()) return 'That is not a valid color.';
		var crgb = color.toRgb();
		var text = (crgb.r * 0.299) + (crgb.g * 0.587) + (crgb.b * 0.114) > 186 ? '000000' : 'ffffff';

		var message = await msg.channel.createMessage({embed: {
			title: "Color "+color.toHexString().toUpperCase(),
			image: {
				url: `https://sheep.greysdawn.com/color/${color.toHex()}`
			},
			color: parseInt(color.toHex(), 16)
		}});

		if(!bot.menus) bot.menus = {};
		bot.menus[message.id] = {
			user: msg.author.id,
			data: color,
			timeout: setTimeout(()=> {
				if(!bot.menus[message.id]) return;
				message.removeReactions()
				delete bot.menus[message.id];
			}, 900000),
			execute: async function (bot, m, emoji) {
				switch(emoji.name) {
					case '✅':
						var color = this.data;
						var role;
						try {
							role = m.channel.guild.roles.find(r => r.name == this.user);
							if(!role) role = await bot.createRole(msg.channel.guild.id, {name: this.user, color: parseInt(color.toHex(),16)});
							else role = await bot.editRole(msg.channel.guild.id, role.id, {color: parseInt(color.toHex(), 16)});
							await bot.addGuildMemberRole(msg.channel.guild.id, msg.author.id, role.id);
							await bot.editMessage(m.channel.id, m.id, {content: "Color successfully changed to "+color.toHexString(), embed: {}});
							await bot.removeMessageReactions(m.channel.id, m.id);
							delete bot.menus[m.id];
						} catch(e) {
							console.log(e.stack);
							var err = "";
							if(e.stack.includes('Client.editRole')) {
								err = "Can't edit the role. Make sure I have the `manageRoles` permission";
							} else if(e.stack.includes('Client.removeMessageReactions')) {
								err = "Can't remove the messsage's reactions. Make sure I have the `manageMessages` permission";
							}
							msg.channel.createMessage("Something went wrong; ERR: "+err);
						}
						break;
					case '❌':
						bot.editMessage(m.channel.id, m.id, {content: "Action cancelled", embed: {}});
						bot.removeMessageReactions(m.channel.id, m.id);
						delete bot.menus[m.id];
						break
					case '🔀':
						var color = bot.tc(Math.floor(Math.random()*16777215).toString(16));
						bot.editMessage(m.channel.id, m.id, {embed: {
							title: "Color "+color.toHexString().toUpperCase(),
							image: {
								url: `https://sheep.greysdawn.com/color/${color.toHex()}`
							},
							color: parseInt(color.toHex(), 16)
						}})
						await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, msg.author.id);
						clearTimeout(bot.menus[m.id].timeout)
						bot.menus[m.id] = {
							user: this.user,
							data: color,
							timeout: setTimeout(()=> {
								if(!bot.menus[m.id]) return;
								m.removeReactions()
								delete bot.menus[m.id];
							}, 900000),
							execute: this.execute
						};
						break;
				}
			}
		};

		["✅", "❌", "🔀"].forEach(r => message.addReaction(r));
		return;
	},
	alias: ['c', 'cl', 'colour', 'ch', 'change'],
	module: 'utility',
	guildOnly: true
}