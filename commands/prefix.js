module.exports = {
	help: ()=> "Sets guild-specific prefix.",
	usage: ()=> [ " <prefix> - Sets prefix for the guild (views current prefix if no prefix is supplied",
				  " clear - Resets the server's prefix"],
	execute: async (bot, msg, args) =>{
		var scfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(args[0]) {
			if(scfg){
				bot.db.query(`UPDATE configs SET prefix=? WHERE srv_id='${msg.guild.id}'`,[args.join(" ")],(err,rows)=>{
					if(err) console.log(err)
				})
			} else {
				bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?,?)`,[msg.guild.id,args.join(" "),{},"",{},"",{},[]],(err,rows)=>{
					if(err) console.log(err);
				})
			}
			msg.channel.createMessage("Prefix changed.");
		} else {
			msg.channel.createMessage((scfg && scfg.prefix ? `Current prefix: ${scfg.prefix}` : `No custom prefix has been registered for this server.`))
		}
	},
	subcommands: {},
	module: "admin",
	guildOnly: true,
	permissions: ["manageGuild"]
}

var sc = module.exports.subcommands;

sc.clear = {
	help: ()=> "Clears the server's prefix",
	usage: ()=> [" - Resets the server's prefix"],
	execute: async (bot, msg, args) => {
		var scfg = await bot.utils.getConfig(bot, msg.guild.id);
		if(scfg){
			bot.db.query(`UPDATE configs SET prefix=? WHERE srv_id='${msg.guild.id}'`,[''],(err,rows)=>{
				if(err) console.log(err)
			})
		} else {
			bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?,?)`,[msg.guild.id,'',{},"",{},"",{},[]],(err,rows)=>{
				if(err) console.log(err);
			})
		}

		msg.channel.createMessage("Prefix reset.");
	}
}