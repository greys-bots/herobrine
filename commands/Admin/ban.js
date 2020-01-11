module.exports = {
	help: ()=> "[Hack]bans members.",
	usage: ()=> [" [userID] - Bans member with that ID."],
	execute: async (bot, msg, args)=>{
		args = args.join(" ").split(/(,?\s)/);
		var ind;
		var membs;
		var reason;
		if(args.length > 1) {
			ind = args.findIndex(a => !a.replace(/[<@!>]/g,"").match(/^(?:<@)?!?\d{17,}$>?/) && !a.match(/\s/));
			if(ind > -1) {
				membs = args.slice(0, ind).filter(x => !x.match(/\s/));
				reason = args.slice(ind-1).join("");
			} else {
				membs = args.filter(x => !x.match(/\s/));
				reason = "Banned through command";
			}
		} else {
			membs = args.filter(x => !x.match(/\s/));
			reason = "Banned through command";
		}
		
		var b = await msg.guild.getBans()

		var succ = [];
		for(var i = 0; i < membs.length; i++) {
			var u;
			try {
				u = await bot.getRESTUser(membs[i].replace(/[<@!>]/g,""));
			} catch(e) {
				console.log(e);
				succ.push({id: membs[i].replace(/[<@!>]/g,""), pass: false, reason: "User does not exist."});
				continue;
			}

			if(b && b.find(x => x.user.id == u.id)){
				succ.push({id: u.id, pass: true, info: u});
			} else {
				try {
					bot.banGuildMember(msg.guild.id, u.id, 0, reason || "Banned through command.");
				} catch(e) {
					console.log(e);
					succ.push({id: u.id, pass: false, reason: "Couldn't ban member"});
					continue;
				}
				succ.push({id: u.id, pass: true, info: u});
			}
		}

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
	},
	permissions: ["banMembers"],
	guildOnly: true,
	module: "admin"
}