module.exports = {
	help: ()=> "Used to edit server welcoming protocol",
	usage: ()=> [" enable - enables welcome protocol",
				" disable - disables welcome protocol",
				" channel <channel> - [re]sets welcome channel",
				" autoroles [comma, separated, role names] - default roles to add to members",
				" message [message goes here] - sets welcome message (use `hh!help admin welcome message` for more info",
				" config - checks current welcome config"],
	execute: async (bot, msg, args)=>{
		if(!msg.mentions[0]) return msg.channel.createMessage("Please mention the user(s) you want to welcome.");
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(cfg && (cfg.welcome || JSON.parse(cfg.welcome).welcroles)){
			var ad = [];
			var na = [];
			var rls = cfg.welcome.welcroles;
			await Promise.all(msg.mentions.map(async u => {
				var memb = msg.guild.members.find(m => m.id == u.id);
				await Promise.all(rls.map(r => {
					var role = msg.guild.roles.find(rl => rl.id == r);
					if(role){
						memb.addRole(r);
						ad.push(role.name);
					} else {
						na.push(r);
					}
					return new Promise(res => setTimeout(res("done"),100));
				}))
				return new Promise(res => setTimeout(res("done"),100));
			})).then(()=>{
				if(na.length > 0){
					var sn = cfg.welcome;
					sn.welcroles = sn.welcroles.split(", ").filter(x => !na.includes(x)).join(", ");
					bot.db.query(`UPDATE configs SET welcome=? WHERE srv_id='${msg.guild.id}'`,[cfg.welcome],(err,rows)=>{
						if(err) console.log(err);
						msg.author.getDMChannel().then(ch => ch.createMessage("Welcome roles not found: "+na.join(", ")+"\nI've removed them from the welcroles list."));
					})
				}
				msg.mentions.forEach(mb => {
					msg.guild.members.find(mm => mm.id == mb.id).user.getDMChannel().then(ch => {
						ch.createMessage("Welcome to "+msg.guild.name+"!\nRoles added: "+ad.join(", ") || "none");
					})
				})
			})
		} else {
			msg.author.getDMChannel().then(ch => ch.createMessage("There are no welcome roles available in that server."))
		}
	},
	subcommands: {},
	guildOnly: true,
	alias: ["welc"],
	module: "admin",
	permisions: ["manageGuild"]
}

module.exports.subcommands.channel = {
	help: ()=> "Sets (or resets) welcome channel.",
	usage: ()=> [" <channel> - sets welcome channel to this, or resets if nothing's given. accepts mention, name, and ID"],
	execute: async (bot, msg, args)=>{
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!args[0]) {
			if(cfg){
				var w = cfg.welcome
				w.channel = "";
				bot.db.query(`UPDATE configs SET welcome=? WHERE srv_id=?`,[w, msg.guild.id],(err,rows)=>{
					if(err) {
						console.log(err);
						msg.channel.createMessage("There was an error.");
					} else {
						msg.channel.createMessage("Channel reset.")
					}
				})
			} else {
				msg.channel.createMessage("Channel reset.")
			}
		} else {
			if(cfg){
				var w = cfg.welcome;
				if(msg.channelMentions > 0){
					w.channel = msg.channelMentions[0];
					bot.db.query(`UPDATE configs SET welcome=? WHERE srv_id=?`,[w, msg.guild.id],(err,rows)=>{
						if(err) return console.log(err);
						msg.channel.createMessage("Channel updated.")
					})
				} else {
					if(msg.guild.channels.find(c => c.name == args[0].toLowerCase() || c.id == args[0]).id){
						w.channel = msg.guild.channels.find(c => c.name == args[0].toLowerCase() || c.id == args[0]).id;
						console.log(w.channel)
						bot.db.query(`UPDATE configs SET welcome=? WHERE srv_id=?`,[w, msg.guild.id],(err,rows)=>{
							if(err) return console.log(err);
							msg.channel.createMessage("Channel updated.")
						})
					} else {
						msg.channel.createMessage("Channel not found.")
					}
				}
			} else {
				if(msg.channelMentions){
					bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?,?)`,[msg.guild.id,"",{channel:msg.channelMentions[0]},"",{},"",{},[]],(err,rows)=>{
						msg.channel.createMessage("Channel updated.")
					})
				} else {
					if(msg.guild.channels.find(c => c.name == args[0].toLowerCase() || c.id == args[0])){
						var ch = msg.guild.channels.find(c => c.name == args[0].toLowerCase() || c.id == args[0]).id;
						bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?,?)`,[msg.guild.id,"",{channel:ch},"",{},"",{},[]])
					} else {
						msg.channel.createMessage("Channel not found.")
					}
				}
			}
		}
	},
	guildOnly: true,
	alias: ["chan"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.message = {
	help: ()=> "Sets (or resets) welcome message.",
	usage: ()=> [" <new message> - sets welcome message to this, or resets if nothing's given"],
	desc: ()=> ["**Defined Vars**",
				"$MEMBER.MENTION = mentions the member who joined",
				"$MEMBER.NAME = gives the member's name and discriminator",
				"$MEMBER.ID = gives the member's ID",
				"$GUILD.NAME = gives the guild's name",
				"*Vars should be in all caps*"].join("\n"),
	execute: async (bot, msg, args)=>{
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!args[0]) {
			if(cfg){
				var w = JSON.parse(cfg);
				w.msg = "";
				bot.db.query(`UPDATE configs SET welcome=? WHERE srv_id=?`,[w, msg.guild.id],(err,rows)=>{
					if(err) {
						console.log(err);
						msg.channel.createMessage("There was an error.");
					} else {
						msg.channel.createMessage("Message reset.")
					}
				})
			} else {
				msg.channel.createMessage("Message reset.")
			}
		} else {
			if(cfg){
				var w = cfg.welcome;
				w.msg = args.join(" ");
				bot.db.query(`UPDATE configs SET welcome=? WHERE srv_id=?`,[w, msg.guild.id],(err,rows)=>{
					if(err) return console.log(err);
					msg.channel.createMessage("Message updated.")
				})
			} else {
				bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?,?)`,[msg.guild.id,"",{msg:args.join(" ")},"",{},"",{},[]],(err,rows)=>{
					msg.channel.createMessage("Message updated.")
				})
			}
		}
	},
	guildOnly: true,
	alias: ["msg"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.enable = {
	help: ()=> "Enables welcome protocol.",
	usage: ()=> [" - enables welcome protocol"],
	execute: async (bot, msg, args)=>{
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(cfg){
			var w = cfg.welcome;
			w.enabled = true;
			bot.db.query(`UPDATE configs SET welcome=? WHERE srv_id=?`,[w,msg.guild.id],(err,rows)=>{
				if(err) return console.log(err);
				msg.channel.createMessage("Welcome enabled.")
			})
		} else {
			msg.channel.createMessage("Welcome not enabled; no configuration exists yet.");
		}
	},
	guildOnly: true,
	alias: ["e","1"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.disable = {
	help: ()=> "Disables welcome protocol.",
	usage: ()=> [" - disables welcome protocol"],
	execute: async (bot, msg, args)=>{
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(cfg){
			var w = cfg.welcome;
			w.enabled = false;
			bot.db.query(`UPDATE configs SET welcome=? WHERE srv_id=?`,[w,msg.guild.id],(err,rows)=>{
				if(err) return console.log(err);
				msg.channel.createMessage("Welcome disabled.")
			})
		} else {
			msg.channel.createMessage("Welcome not disabled; no configuration exists yet.");
		}
	},
	guildOnly: true,
	alias: ["d","0"],
	permisions: ["manageGuild"]
}

module.exports.subcommands.preroles = {
	help: ()=> "Add roles to be added when users join the server.",
	usage: ()=> [" [roles, to, add] -[re]sets autoroles for the server. accepts names and IDs"],
	execute: async (bot, msg, args) => {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(cfg){
			if(args[0]){
				var embed = {
					title: "Autoroles",
					fields: [
						{name: "Indexed", value: "none"},
						{name: "Not indexed: reason", value: "none"}
					]
				};
				var rs = [];
				await Promise.all(args.join(" ").split(/,\s*/).map(ar =>{
					if(msg.guild.roles.find(r => r.name == ar || r.id == ar)){
						embed.fields[0].value = (embed.fields[0].value == "none" ?
							msg.guild.roles.find(r => r.name == ar || r.id == ar).name :
							embed.fields[0].value + "\n" + msg.guild.roles.find(r => r.name == ar || r.id == ar).name);
						rs.push(msg.guild.roles.find(r => r.name == ar || r.id == ar).id);
					} else {
						embed.fields[1].value = (embed.fields[1].value == "none" ?
							ar :
							embed.fields[1].value + " " + ar);
					}
					return new Promise(res => setTimeout(res("done"),100))
				})).then(()=>{
					bot.db.query(`UPDATE configs SET autoroles=? WHERE srv_id='${msg.guild.id}'`,[rs.join(", ")],(err,rows)=>{
						if(err) {
							console.log(err);
							msg.channel.createMessage("There was an error.")
						} else {
							msg.channel.createMessage({embed})
						}
					})
				})
			} else {
				bot.db.query(`UPDATE configs SET autoroles="" WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
					if(err) {
						console.log(err);
						msg.channel.createMessage("There was an error.")
					} else {
						msg.channel.createMessage("Autoroles reset.")
					}
				})
			}
		} else {
			if(args[0]){
				var embed = {
					title: "Autoroles",
					fields: [
						{name: "Indexed", value: "none"},
						{name: "Not indexed: reason", value: "none"}
					]
				};
				var rs = [];
				await Promise.all(args.join(" ").split(/,\s*/).map(ar =>{
					if(msg.guild.roles.find(r => r.name == ar || r.id == ar)){
						embed.fields[0].value = (embed.fields[0].value == "none" ?
							msg.guild.roles.find(r => r.name == ar || r.id == ar).name :
							embed.fields[0].value + "\n" + msg.guild.roles.find(r => r.name == ar || r.id == ar).name);
						rs.push(msg.guild.roles.find(r => r.name == ar || r.id == ar).id);
					} else {
						embed.fields[1].value = (embed.fields[1].value == "none" ?
							ar :
							embed.fields[1].value + " " + ar);
					}
					return new Promise(res => setTimeout(res("done"),100))
				})).then(()=>{
					bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?,?)`,[msg.guild.id,"",{},rs.join(", "),{},"",{},[]],(err,rows)=>{
						msg.channel.createMessage("Autoroles updated.");
					})
				})
			} else {
				msg.channel.createMessage("Autoroles reset.");
			}
		}
	},
	guildOnly: true,
	alias: ["autoroles","autorole"],
	permissions: ["manageRoles","manageGuil"]
}

module.exports.subcommands.postroles = {
	help: ()=> "Sets a list of roles to add to members after they're welcomed.",
	usage: ()=> [" [roles, to, index] - indexes roles to be added after using `hh!* welcome [member]`"],
	execute: async (bot, msg, args)=>{
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(cfg){
			var wlc = cfg.welcome;
			wlc.welcroles = [];
			if(args[0]){
				var embed = {
					title: "Postroles",
					fields: [
						{name: "Indexed", value: "none"},
						{name: "Not indexed: reason", value: "none"}
					]
				};
				await Promise.all(args.join(" ").split(/,\s*/).map(ar =>{
					if(msg.guild.roles.find(r => r.name == ar || r.id == ar)){
						embed.fields[0].value = (embed.fields[0].value == "none" ?
							msg.guild.roles.find(r => r.name == ar || r.id == ar).name :
							embed.fields[0].value + "\n" + msg.guild.roles.find(r => r.name == ar || r.id == ar).name);
						wlc.welcroles.push(msg.guild.roles.find(r => r.name == ar || r.id == ar).id);
					} else {
						embed.fields[1].value = (embed.fields[1].value == "none" ?
							ar :
							embed.fields[1].value + " " + ar);
					}
					return new Promise(res => setTimeout(res("done"),100))
				})).then(()=>{
					bot.db.query(`UPDATE configs SET welcome=? WHERE srv_id=?`,[wlc, msg.guild.id],(err,rows)=>{
						if(err) {
							console.log(err);
							msg.channel.createMessage("There was an error.")
						} else {
							msg.channel.createMessage({embed})
						}
					})
				})
			} else {
				bot.db.query(`UPDATE configs SET welcome=? WHERE srv_id=?`,[wlc, msg.guild.id],(err,rows)=>{
					if(err) {
						console.log(err);
						msg.channel.createMessage("There was an error.")
					} else {
						msg.channel.createMessage("Postroles reset.")
					}
				})
			}
		} else {
			if(args[0]){
				var embed = {
					title: "Autoroles",
					fields: [
						{name: "Indexed", value: "none"},
						{name: "Not indexed: reason", value: "none"}
					]
				};
				var rs = [];
				await Promise.all(args.join(" ").split(/,\s*/).map(ar =>{
					if(msg.guild.roles.find(r => r.name == ar || r.id == ar)){
						embed.fields[0].value = (embed.fields[0].value == "none" ?
							msg.guild.roles.find(r => r.name == ar || r.id == ar).name :
							embed.fields[0].value + "\n" + msg.guild.roles.find(r => r.name == ar || r.id == ar).name);
						rs.push(msg.guild.roles.find(r => r.name == ar || r.id == ar).id);
					} else {
						embed.fields[1].value = (embed.fields[1].value == "none" ?
							ar :
							embed.fields[1].value + " " + ar);
					}
					return new Promise(res => setTimeout(res("done"),100))
				})).then(()=>{

					bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?,?)`,[msg.guild.id,"",{welcroles:rs.join(", ")},"",{},"",{},[]],(err,rows)=>{
						if(err) console.log(err);
						msg.channel.createMessage("Postroles updated.")
					})
				})
			} else {
				msg.channel.createMessage("Postroles reset.");
			}
		}
	},
	guildOnly: true,
	permissions: ["manageRoles","manageGuild"],
	alias: ["postrole","welcomerole","welcomeroles","welcroles","welcrole"]
}


module.exports.subcommands.config = {
	help: ()=> "View server's welcome config",
	usage: ()=> [' - Views the config'],
	execute: async (bot, msg, args)=> {
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(!cfg) return msg.chanel.createMessage('No config exists for this server.');
		console.log(cfg);
		msg.channel.createMessage({embed: {
			title: "Welcome Config",
			fields: [
			{name: "Enabled?", value: cfg.welcome.enabled || 'Not set up'},
			{name: "Channel", value: cfg.welcome.channel || 'Not set up'},
			{name: "Message", value: cfg.welcome.msg || 'Not set up'}
			]
		}})
	},
	guildOnly: true,
	permissions: ['manageGuild'],
	alias: ['cfg', 'conf']
}