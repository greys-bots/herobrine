var Util = require("../utilities");
//- - - - - - - - - - - Prefix - - - - - - - - - -

module.exports = {
	help: ()=> "Sets guild-specific prefix.",
	usage: ()=> [ "[prefix] - Sets prefix for the guild"],
	execute: (bot, msg, args) =>{
		bot.db.query(`SELECT * FROM configs WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
			if(err){
				console.log(err);
				msg.channel.createMessage("There was an error.");
			} else {
				var scfg = rows[0];
				if(scfg){
					bot.db.query(`UPDATE configs SET prefix=? WHERE srv_id='${msg.guild.id}'`,[args[0]],(err,rows)=>{
						if(err) console.log(err)
					})
				} else {
					bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?,?)`,[msg.guild.id,args[0],{},"",{},"",{},[]],(err,rows)=>{
						if(err) console.log(err);
					})
				}
				Util.reloadConfig(bot, msg.guild.id);
				msg.channel.createMessage((args[0] ? "Prefix changed." : "Prefix reset."));
			}
		})
	},
	module: "admin",
	guildOnly: true,
	permissions: ["manageGuild"]
}
