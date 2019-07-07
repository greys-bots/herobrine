module.exports = {
	help: ()=> "Sets guild-specific prefix.",
	usage: ()=> [ "[prefix] - Sets prefix for the guild"],
	execute: async (bot, msg, args) =>{
		var scfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(scfg){
			bot.db.query(`UPDATE configs SET prefix=? WHERE srv_id='${msg.guild.id}'`,[args[0]],(err,rows)=>{
				if(err) console.log(err)
			})
		} else {
			bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?,?)`,[msg.guild.id,args[0],{},"",{},"",{},[]],(err,rows)=>{
				if(err) console.log(err);
			})
		}
		msg.channel.createMessage((args[0] ? "Prefix changed." : "Prefix reset."));
	},
	module: "admin",
	guildOnly: true,
	permissions: ["manageGuild"]
}
