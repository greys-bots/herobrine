module.exports = {
	help: ()=> "Prunes messages in a channel.",
	usage: ()=> [" <number> - deletes [number] messages from the current channel, or 100 messages if not specified"],
	execute: async (bot, msg, args)=>{
		var del = (args[0] != NaN ? Number(args[0]) : 100);
		await msg.channel.purge(del).then((n)=>{
			msg.channel.createMessage(n + " messages deleted.").then(ms=>{
				setTimeout(()=>{
					ms.delete();
				},5000)
			});
		}).catch(e=>console.log(e))
	},
	subcommands: {},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["delete", "purge"],
	module: "admin"
}

module.exports.subcommands.safe = {
	help: ()=> "Prunes messages in a channel, unless pinned.",
	usage: ()=> [" <number> - deletes [num] messages, or 100 if not specified"],
	execute: async (bot, msg, args)=>{
		var del = (args[0] ? args[0] : 100);
		await msg.channel.purge(del,(m)=>!m.pinned).then((n)=>{
			msg.channel.createMessage(n + " messages deleted.").then(ms=>{
				setTimeout(()=>{
					ms.delete();
				},5000)
			});
		}).catch(e=>console.log(e))
	},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["--s","s","s"]
}

module.exports.subcommands.archive = {
	help: ()=> "Prunes messages in a channel and also archives them.",
	usage: ()=> [" <number> - deletes [num] messages, or 100 if not specified"],
	execute: (bot, msg, args)=> {
		var del = (args[0] ? args[0] : 100);

		bot.commands.archive.execute(bot, msg, [del]);
		bot.commands.prune.execute(bot, msg, [del])
	},
	permissions: ["manageMessages"],
	guildOnly: true,
	alias: ["--a","-a","a"]
}