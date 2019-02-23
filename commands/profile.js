// - - - - - - - - - - Profiles - - - - - - - - - -
module.exports = {
	help: ()=> "Shows your profile.",
	usage: ()=> [" - views your profile",
				" [discord ID] - views another user's profile",
				" edit - opens a menu for profile editing",
				" enable/disable - enables/disables level-up messages"],
	execute: (bot, msg, args)=>{
		var id = (args[0] ? args[0] : msg.author.id);
		bot.db.query(`SELECT * FROM profiles WHERE usr_id='${id}'`,(err,rows)=>{
			if(err){
				console.log(err);
				return msg.channel.createMessage("User profile not found or not indexed yet.");
			}
			msg.channel.createMessage({embed:{
				author: {
					name: msg.guild.members.find(m => m.id == id).username,
					icon_url: msg.guild.members.find(m => m.id == id).avatarURL
				},
				thumbnail: {
					url: msg.guild.members.find(m => m.id == id).avatarURL
				},
				color: (JSON.parse(rows[0].info).color ? JSON.parse(rows[0].info).color : 0),
				title: JSON.parse(rows[0].info).title,
				description: JSON.parse(rows[0].info).bio +
				"\n**LEVEL:** "+rows[0].lvl +
				"\n**EXP:** "+rows[0].exp +
				"\n**CASH:** "+rows[0].cash +
				(rows[0].disabled == "1" ? "\n\n*Level up messages are disabled for this user.*" : "")
			}})
		})
	},
	alias: ["p","prof"],
	subcommands: {},
	guildOnly: true,
	module: "utility"
}

module.exports.subcommands.disable = {
	help: ()=> "Disables level up messages.",
	usage: ()=> [" - disables level up messages"],
	execute: (bot, msg, args)=>{
		bot.db.query(`SELECT * FROM profiles WHERE usr_id='${msg.author.id}'`,(err,rows)=>{
			if(err) return console.log(err);
			if(rows[0]){
				if(rows[0].disabled == "1"){
					msg.channel.createMessage("Already disabled.");
				} else {
					bot.db.query(`UPDATE profiles SET disabled='${"1"}' WHERE usr_id='${msg.author.id}'`,(err,rows)=>{
						if(err){
							console.log(err);
							return msg.channel.createMessage("Something went wrong.");
						}
						msg.channel.createMessage("Level-up messages disabled.")
					})
				}
			} else {
				msg.channel.createMessage("Something went wrong.");
			}
		})
	}
}

module.exports.subcommands.enable = {
	help: ()=> "Enables level up messages.",
	usage: ()=> [" - enables level up messages"],
	execute: (bot, msg, args)=>{
		bot.db.query(`SELECT * FROM profiles WHERE usr_id='${msg.author.id}'`,(err,rows)=>{
			if(err) return console.log(err);
			if(rows[0]){
				if(rows[0].disabled == "0"){
					msg.channel.createMessage("Already enabled.");
				} else {
					bot.db.query(`UPDATE profiles SET disabled='${"0"}' WHERE usr_id='${msg.author.id}'`,(err,rows)=>{
						if(err){
							console.log(err);
							return msg.channel.createMessage("Something went wrong.");
						}
						msg.channel.createMessage("Level-up messages enabled.")
					})
				}
			} else {
				msg.channel.createMessage("Something went wrong.");
			}
		})
	}
}

module.exports.subcommands.edit = {
	help: ()=> "Runs a menu for editing profiles.",
	usage: ()=> [" - opens an edit menu",
				" [bio/title/color] [new value] - quick edit method for your bio/title/color"],
	execute: async (bot, msg, args)=>{
		switch(args[0]){
			case "bio":
				var b = (args[1] ? args.slice(1).join(" ") : "Beep Boop!");
				bot.db.query(`SELECT * FROM profiles WHERE usr_id='${msg.author.id}'`,(err,rows)=>{
					if(err){
						console.log(err);
						return msg.channel.createMessage("There was an error.")
					}
					if(rows[0]){
						var info = JSON.parse(rows[0].info);
						info.bio = b;
						bot.db.query(`UPDATE profiles SET info=? WHERE usr_id='${msg.author.id}'`,[info],(err,rows)=>{
							if(err){
								console.log(err)
								return msg.channel.createMessage("There was an error.");
							}
							msg.channel.createMessage((t == "Beep Boop!" ? "Bio reset." : "Bio updated."));
						})
					} else {
						msg.channel.createMessage("Something went wrong.");
					}
				})
				break;
			case "title":
				var t = (args[1] ? args.slice(1).join(" ") : "Title Here");
					bot.db.query(`SELECT * FROM profiles WHERE usr_id='${msg.author.id}'`,(err,rows)=>{
						if(err){
							console.log(err);
							return msg.channel.createMessage("There was an error.")
						}
						if(rows[0]){
							var info = JSON.parse(rows[0].info);
							info.title = t;
							bot.db.query(`UPDATE profiles SET info=? WHERE usr_id='${msg.author.id}'`,[info],(err,rows)=>{
								if(err){
									console.log(err)
									return msg.channel.createMessage("There was an error.");
								}
								msg.channel.createMessage((t == "Title Here" ? "Title reset." : "Title updated."));
							})
						} else {
							msg.channel.createMessage("Something went wrong.");
						}
					})
				break;
			case "color":
				var c = (args[1] ? parseInt(args[1].replace("#",""),16) : 0);
					bot.db.query(`SELECT * FROM profiles WHERE usr_id='${msg.author.id}'`,(err,rows)=>{
						if(err){
							console.log(err);
							return msg.channel.createMessage("There was an error.")
						}
						if(rows[0]){
							var info = JSON.parse(rows[0].info);
							info.color = c;
							bot.db.query(`UPDATE profiles SET info=? WHERE usr_id='${msg.author.id}'`,[info],(err,rows)=>{
								if(err){
									console.log(err)
									return msg.channel.createMessage("There was an error.");
								}
								msg.channel.createMessage((c == 0 ? "Color reset." : "Color updated."));
							})
						} else {
							msg.channel.createMessage("Something went wrong.");
						}
					})
				break;
			default:
				var info;
				await bot.db.query(`SELECT * FROM profiles WHERE usr_id='${msg.author.id}'`,(err,rows)=>{
					if(err){
						console.log(err);
						return msg.channel.createMessage("There was an error.");
					}
					if(rows[0]){
						info = JSON.parse(rows[0].info);
					} else {
						msg.channel.createMessage("Something went wrong.")
					}
				})
				msg.channel.createMessage("```\nWhat do you want to edit? (Choose a number)\n\n[1] Title\n[2] Bio\n[3] Color\n[4] Cancel\n```");
				msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 10000, maxMatches: 1}).then(res=>{
					if(res[0]){
						switch(res[0].content){
							case "1":
								msg.channel.createMessage("Write what you want the new title to be.");
								msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time: 20000, maxMatches: 1}).then(res2=>{
									if(res2[0]){
										info.title = res2[0].content;
										bot.db.query(`UPDATE profiles SET info=? WHERE usr_id='${msg.author.id}'`,[info],(err,rows)=>{
											if(err){
												console.log(err);
												msg.channel.createMessage("There was an error.")
											} else {
												msg.channel.createMessage("Title updated.")
											}
										})
									} else {
										msg.channel.createMessage("Action cancelled.")
									}
								})
								break;
							case "2":
								msg.channel.createMessage("Write what you want the new bio to be.");
								msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time: 20000, maxMatches: 1}).then(res2=>{
									if(res2[0]){
										info.bio = res2[0].content;
										bot.db.query(`UPDATE profiles SET info=? WHERE usr_id='${msg.author.id}'`,[info],(err,rows)=>{
											if(err){
												console.log(err);
												msg.channel.createMessage("There was an error.")
											} else {
												msg.channel.createMessage("Bio updated.")
											}
										})
									} else {
										msg.channel.createMessage("Action cancelled.")
									}
								})
								break;
							case "3":
								msg.channel.createMessage("Write what you want the new color to be.");
								msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time: 20000, maxMatches: 1}).then(res2=>{
									if(res2[0]){
										info.color = parseInt(res2[0].content.replace("#",""),16);
										bot.db.query(`UPDATE profiles SET info=? WHERE usr_id='${msg.author.id}'`,[info],(err,rows)=>{
											if(err){
												console.log(err);
												msg.channel.createMessage("There was an error.")
											} else {
												msg.channel.createMessage("Color updated.")
											}
										})
									} else {
										msg.channel.createMessage("Action cancelled.")
									}
								})
								break;
							default:
								msg.channel.createMessage("Action cancelled.")
								break;
						}
					} else {
						msg.channel.createMessage("Action cancelled.")
					}
				})
				break;
		}
	}
}