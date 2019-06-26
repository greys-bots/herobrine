module.exports = {
	help: ()=> "Add and remove self roles.",
	usage: ()=> [" - display this help text","s - list available roles"],
	execute: (bot, msg, args)=>{
		bot.db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
			if(rows.length>0){
				msg.channel.createMessage({
					embed: {
						fields:[{
							name:"\\~\\~\\* Available Roles \\*\\~\\~",
							value:rows.map(r => {if(msg.guild.roles.find(rl => rl.id == r.id) && r.sar == "1") return msg.guild.roles.find(rl => rl.id == r.id).name.toLowerCase();})
							.filter(x => x!=null)
							.sort()
							.join("\n")
						}]
					}
				});
			} else {
				msg.channel.createMessage("There are no indexed roles for this server.");
			}
			bot.db.query("BEGIN TRANSACTION");
			rows.forEach(r =>{
				if(!msg.guild.roles.find(rl => rl.id == r.id)){
					bot.db.query(`DELETE FROM roles WHERE id='${r.id}'`);
				}
			})
			bot.db.query("COMMIT");
		});
	},
	module: "utility",
	subcommands: {},
	guildOnly: true,
	alias: ["roles", "roll"]
}

module.exports.subcommands.list = {
	help: ()=> "Lists available roles for a server.",
	usage: ()=> [" - Lists all selfroles for the server"],
	execute: (bot, msg, args)=>{
		bot.db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{	
			if(rows.length>0){	
				msg.channel.createMessage({	
					embed: {	
						fields:[{	
							name:"\\~\\~\\* Available Roles \\*\\~\\~",	
							value:rows.map(r => {if(msg.guild.roles.find(rl => rl.id == r.id) && r.sar == "1") return msg.guild.roles.find(rl => rl.id == r.id).name.toLowerCase();})	
							.filter(x => x!=null)	
							.sort()	
							.join("\n")
						}]
					}
				});
			} else {
				msg.channel.createMessage("There are no indexed roles for this server.");
			}
			bot.db.query("BEGIN TRANSACTION");
			rows.forEach(r =>{
				if(!msg.guild.roles.find(rl => rl.id == r.id)){
					bot.db.query(`DELETE FROM roles WHERE id='${r.id}'`);
				}
			})
			bot.db.query("COMMIT");
		});
	}
}

module.exports.subcommands.remove = {
	help: ()=> "Removes a selfrole.",
	usage: ()=> [" [comma, separated, role names] - Removes given roles, if applicable"],
	execute: (bot, msg, args)=>{
		let rlstrmv = args.join(" ").split(/,\s*/g);
		let nrem = [];
		let rem = [];
		let rmvRoles = async function (){
			await Promise.all(rlstrmv.map((r)=>{
				if(msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase())){
					bot.db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase()).id}'`,async (err,rows)=>{
						if(err){
							console.log(err);
							msg.channel.createMessage("There was an error.");
						} else if(rows.length<1) {
							nrem.push({name:r,reason:"Role has not been indexed."});
						} else if(rows[0].sar=="0"){
							nrem.push({name:r,reason:"Role is not self assignable."});
						} else if(!msg.member.roles.includes(rows[0].id)){
							console.log("Could not remove "+r+" because they don't have it.");
							nrem.push({name:r,reason:"You don't have this role."});
						} else {
							rem.push(r);
							msg.member.removeRole(rows[0].id);
						}
					})
				} else {
					nrem.push({name:r,reason:"Role does not exist."});
				}
				return new Promise((resolve,reject)=>{
					setTimeout(()=>{
						resolve("done");
					},100);
				});
			})).then(()=>{
				msg.channel.createMessage({
					embed: {
						fields:[
						{name:"Removed",value: (rem.length>0 ? rem.join("\n") : "None")},
						{name:"Not removed: Reason",value: (nrem.length>0 ? nrem.map(nar=>nar.name+": "+nar.reason).join("\n") : "None")}
						]
					}
				});
			})
		}
		rmvRoles();
	}
}

module.exports.subcommands.add = {
	help: ()=> "Adds selfroles.",
	usage: ()=> [" [comma, separated, role names] - Adds given roles, if available"],
	execute: (bot, msg, args)=>{
		let rls = args.join(" ").split(/,\s*/g);
		let nad = [];
		let ad = [];
		let addRoles = async function (){
			await Promise.all(rls.map((r)=>{
				if(msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase())){
					bot.db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase()).id}'`,async (err,rows)=>{
						if(err){
							console.log(err);
							msg.channel.createMessage("There was an error.");
						} else if(rows.length<1) {
							nad.push({name:r,reason:"Role has not been indexed."});
						} else if(rows[0].sar=="0"){
							nad.push({name:r,reason:"Role is not self assignable."});
						} else if(msg.member.roles.includes(rows[0].id)){
							console.log("Could not add "+r+" because they have it already.");
							nad.push({name:r,reason:"You already have this role."});
						} else {
							ad.push(r);
							msg.member.addRole(rows[0].id);
						}
					})
				} else {
					nad.push({name:r,reason:"Role does not exist."});
				}
				return new Promise((resolve,reject)=>{
					console.log("Resolving...")
					setTimeout(()=>{
						resolve("done");
					},100);
				});
			})).then(()=>{
				msg.channel.createMessage({
					embed: {
						fields:[
						{name:"Added",value: (ad.length>0 ? ad.join("\n") : "None")},
						{name:"Not added: Reason",value: (nad.length>0 ? nad.map(nar=>nar.name+": "+nar.reason).join("\n") : "None")}
						]
					}
				});
			})
		}
		addRoles();
	}
}
