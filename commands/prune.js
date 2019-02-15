// - - - - - - - - - - - Prune  - - - - - - - - - - -
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
	alias: ["delete"],
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
	alias: ["--s","s"]
}