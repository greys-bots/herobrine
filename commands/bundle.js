module.exports = {
	help: "Add and remove role bundles.",
	usage: [" add [bundle name] - adds an available bundle to you",
				" remove [bundle name] - removes an available bundle from you"],
	examples: ["hh!bundle add test bundle","hh!bundle remove test bundle"],
	subcommands: {},
	guildOnly: true,
	module: "utility",
	alias: ["bundles"]
}

module.exports.subcommands.add = {
	help: ()=> "Adds bundle to the user.",
	usage: ()=> [" [bundle name] - adds the given bundle"],
	execute: (bot, msg, args) => {
		var name = args.join(" ").toLowerCase();
		bot.db.query(`SELECT * FROM bundles WHERE srv_id='${msg.guild.id}' AND name='${name}'`,async (err,rows)=>{
			if(err){
				console.log(err);
				msg.channel.createMessage("There was an error.");
			} else if(rows[0]) {
				if(rows[0].sa!=1) return msg.channel.createMessage("That bundle is not self-assignable.");
				var rta = rows[0].roles.split(", ");
				var embed = {
					title: "Results",
					fields: [
						{name: "Added", value: "None"},
						{name: "Not Added", value: "None"}
					]
				}
				await Promise.all(rta.map((r)=>{
					var member = msg.member;
					var tmp = msg.guild.roles.find(rl => rl.id == r);
					if(tmp){
						if(member.roles.includes(tmp.id)){
							embed.fields[1].value = embed.fields[1].value == "None" ?
											tmp.name + " - member already has role.\n" :
											embed.fields[1].value + tmp.name + " - member already has role.\n";
						} else {
							member.addRole(tmp.id);
							embed.fields[0].value = embed.fields[0].value == "None" ?
											tmp.name + "\n" :
											embed.fields[0].value + tmp.name + "\n";
						}
					} else {
						embed.fields[1].value = embed.fields[1].value == "None" ?
											tmp.name + " - role does not exist.\n" :
											embed.fields[1].value + tmp.name + " - role does not exist.\n";
					}
					return new Promise((resolve,reject)=>{
						setTimeout(()=>{
							resolve("done");
						},100);
					});
				})).then(()=>{
					msg.channel.createMessage({embed: embed})
				})
			} else {
				msg.channel.createMessage("That bundle does not exist.")
			}
		})
	},
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: ()=> "Adds bundle to the user.",
	usage: ()=> [" [bundle name] - adds the given bundle"],
	execute: (bot, msg, args) => {
		var name = args.join(" ").toLowerCase();
		bot.db.query(`SELECT * FROM bundles WHERE srv_id='${msg.guild.id}' AND name='${name}'`,async (err,rows)=>{
			if(err){
				console.log(err);
				msg.channel.createMessage("There was an error.");
			} else if(rows[0]) {
				if(rows[0].sa!=1) return msg.channel.createMessage("That bundle is not self-assignable.");
				var rta = rows[0].roles.split(", ");
				var embed = {
					title: "Results",
					fields: [
						{name: "Removed", value: "None"},
						{name: "Not Removed", value: "None"}
					]
				}
				await Promise.all(rta.map((r)=>{
					var member = msg.member;
					var tmp = msg.guild.roles.find(rl => rl.id == r);
					if(tmp){
						if(!member.roles.includes(tmp.id)){
							embed.fields[1].value = embed.fields[1].value == "None" ?
											tmp.name + " - member already has role.\n" :
											embed.fields[1].value + tmp.name + " - member already doesn't have role.\n";
						} else {
							member.removeRole(tmp.id);
							embed.fields[0].value = embed.fields[0].value == "None" ?
											tmp.name + "\n" :
											embed.fields[0].value + tmp.name + "\n";
						}
					} else {
						embed.fields[1].value = embed.fields[1].value == "None" ?
											tmp.name + " - role does not exist.\n" :
											embed.fields[1].value + tmp.name + " - role does not exist.\n";
					}
					return new Promise((resolve,reject)=>{
						setTimeout(()=>{
							resolve("done");
						},100);
					});
				})).then(()=>{
					msg.channel.createMessage({embed: embed})
				})
			} else {
				msg.channel.createMessage("That bundle does not exist.")
			}
		})
	},
	guildOnly: true
}

module.exports.subcommands.info = {
	help: ()=> "Displays info for a bundle.",
	usage: ()=> [" [bundle name] - shows info for given bundle"],
	execute: (bot, msg, args)=> {
		var name = args.join(" ");
		bot.db.query(`SELECT * FROM bundles WHERE srv_id='${msg.guild.id}' AND name='${name.toLowerCase()}'`,(err,rows)=>{
			if(err){
				console.log(err);
				msg.channel.createMessage("There was an error.");
			} else {
				if(rows[0]){
					msg.channel.createMessage({embed: {
						title: "Bundles: " + rows[0].name.toLowerCase(),
						fields: [
							{name: "Roles",value: rows[0].roles.split(", ").map(r => msg.guild.roles.find(rl => rl.id == r) ? msg.guild.roles.find(rl => rl.id == r).name : null)
								.filter(x => x!=null).sort().join("\n")},
							{name: "Self assignable", value: rows[0].sa == 1 ? "yes" : "no"}
						]
					}})
				} else {
					msg.channel.createMessage("That bundle does not exist.");
				}
			}
		})
	}
}