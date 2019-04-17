module.exports = {
	help: ()=> "[Hack]bans members.",
	usage: ()=> [" [userID] - Bans member with that ID."],
	execute: async (bot, msg, args)=>{
		var membs = args.join(" ").split(/,*\s+|\n+/);
		var succ = [];
		async function banMembers (){
			return await Promise.all(membs.map(async (m) => {
				await bot.getRESTUser(m).then(async (u)=>{
					await msg.guild.getBans().then(b=>{
						if(b){
							if(b.find(x => x.user.id == m)){
								succ.push({id:m,pass:false,reason:"User already banned"});
							} else {
								bot.banGuildMember(msg.guild.id,m,0,"Banned through command.");
								succ.push({id:m,pass:true})
							}
						} else {
							bot.banGuildMember(msg.guild.id,m,0,"Banned through command.");
							succ.push({id:m,pass:true})
						}
					})
				}).catch(e=>{
					succ.push({id:m,pass:false,reason:"User does not exist."});
				})

				return new Promise((res,rej)=>{
					setTimeout(()=>{
						res({id:m});
					},100)
				})
			})
			)
		}
		banMembers().then(()=>{
			msg.channel.createMessage({embed:{
				title: "Ban Results",
				fields: [
				{
					name: "Banned",
					value: (succ.filter(m => m.pass).length > 0 ? succ.filter(x=> x.pass).map(m => m.id).join("\n") : "None")
				},
				{
					name: "Not Banned",
					value: (succ.filter(m => !m.pass).length > 0 ? succ.filter(x => !x.pass).map(m => m.id + " - " + m.reason).join("\n") : "None")
				}
				]
			}})
		});
	},
	permissions: ["banMembers"],
	guildOnly: true,
	module: "admin"
}