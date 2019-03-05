// - - - - - - - - - - - Adroles - - - - - - - - - - -

module.exports = {
	help: ()=> "Create, delete, edit, add, and remove roles.",
	usage: ()=> [" - shows this help",
				" create [role name] - creates new role",
				" delete [role name] - deletes existing role",
				" edit [role name] [color/name/etc] [new value] - edits existing role",
				" add [comma, separated, role names] [@memberping] - adds roles to specified member",
				" remove [comma, separated, role names] [@memberping] - removes roles from specified member"],
	execute: (bot, msg, args) =>{
		bot.db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
			if(rows.length>0){
				msg.channel.createMessage({
					embed: {
						title:"Roles",
						fields:[{
							name:"\\~\\~\\* Assignable Roles \\*\\~\\~",
							value: rows.map(r => (msg.guild.roles.find(rl => rl.id == r.id) && r.sar==1 ? msg.guild.roles.find(rl => rl.id == r.id).name.toLowerCase() : null)).filter(x=>x!=null).sort().join("\n") || "None"
						},{
							name:"\\~\\~\\* Mod-Only Roles \\*\\~\\~",
							value: rows.map(r => (msg.guild.roles.find(rl => rl.id == r.id) && r.sar==0 ? msg.guild.roles.find(rl => rl.id == r.id).name.toLowerCase() : null)).filter(x=>x!=null).sort().join("\n") || "None"
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
		})
	},
	subcommands: {},
	alias: ["adroles"],
	guildOnly: true,
	permissions: ["manageRoles"],
	module: "admin"
}

module.exports.subcommands.add = {
	help: ()=> "Add roles to mentioned users.",
	usage: ()=>[" [roles, to, add] [@user,@mentions] - adds roles to these users"],
	execute: async (bot, msg, args)=>{
		if(msg.mentions.length > 0){
			var l = msg.mentions.length;
			var ments = args.slice(-l);
			var rta = args.slice(0,-l).join(" ").split(/,\s*/);
			var members = {};
			await Promise.all(ments.map(async m=>{
				var member = await msg.guild.members.find(mb => mb.mention == m || mb.user.mention == m);
				if(member){
					members[m] = {
						title: "**"+member.username+"**",
						fields: [ 
						{name: "Added",
						value: ""},
						{name: "Not Added",
						value: ""}
						]
					}
					await Promise.all(rta.map((r)=>{
						if(msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase())){
							bot.db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase()).id}'`,async (err,rows)=>{
								if(err){
									console.log(err);
									msg.channel.createMessage("There was an error.");
								} else if(rows.length<1) {
									members[m].fields[1].value += r + " - role has not been indexed.\n";
								} else if(member.roles.includes(rows[0].id)){
									members[m].fields[1].value += r + " - already has this role.\n";
								} else {
									members[m].fields[0].value += r + "\n";
									member.addRole(rows[0].id);
								}
							})
						} else {
							members[m].fields[1].value += r + " - role does not exist.\n";
						}
						return new Promise((resolve,reject)=>{
							setTimeout(()=>{
								resolve("done");
							},100);
						});
					}))
					return new Promise((res,rej)=>{
						setTimeout(()=>{
							res("done");
						},100);
					})
				} else {
					members.push({
						title: m,
						description: "Couldn't find member."
					});
				}
			})).then(()=>{
				Object.keys(members).map(mb => {
					msg.channel.createMessage({embed:{
						title: members[mb].title,
						fields: [
							{name: "Added",
							value: (members[mb].fields[0].value == "" ? "None" : members[mb].fields[0].value)
							},
							{name: "Not Added",
							value: (members[mb].fields[1].value == "" ? "None" : members[mb].fields[1].value)
							}
						]
					}
					}).catch(e=> console.log(e));
				})
			})
		} else {
			msg.channel.createMessage("Please mention a user.");
		}
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.remove = {
	help: ()=> "Remove roles from mentioned users.",
	usage: ()=> [" [roles, to, remove] [@user @mention] - removes roles from users"],
	execute: async (bot, msg, args)=> {
		if(msg.mentions.length > 0){
			var l = msg.mentions.length;
			var ments = args.slice(-l);
			var rtr = args.slice(0,-l).join(" ").split(/,\s*/);
			var members = {};
			await Promise.all(ments.map(async m=>{
				var member = await msg.guild.members.find(mb => mb.mention == m || mb.user.mention == m);
				if(member){
					members[m] = {
						title: "**"+member.username+"**",
						fields: [ 
						{name: "Added",
						value: ""},
						{name: "Not Added",
						value: ""}
						]
					}
					await Promise.all(rtr.map((r)=>{
						if(msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase())){
							bot.db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase()).id}'`,async (err,rows)=>{
								if(err){
									console.log(err);
									msg.channel.createMessage("There was an error.");
								} else if(rows.length<1) {
									members[m].fields[1].value += r + " - role has not been indexed.\n";
								} else if(!member.roles.includes(rows[0].id)){
									members[m].fields[1].value += r + " - doesn't have this role.\n";
								} else {
									members[m].fields[0].value += r + "\n";
									member.removeRole(rows[0].id);
								}
							})
						} else {
							members[m].fields[1].value += r + " - role does not exist.\n";
						}
						return new Promise((resolve,reject)=>{
							setTimeout(()=>{
								resolve("done");
							},100);
						});
					}))
					return new Promise((res,rej)=>{
						setTimeout(()=>{
							res("done");
						},100);
					})
				} else {
					members.push({
						title: m,
						description: "Couldn't find member."
					});
				}
			})).then(()=>{
				Object.keys(members).map(mb => {
					msg.channel.createMessage({embed:{
						title: members[mb].title,
						fields: [
							{name: "Added",
							value: (members[mb].fields[0].value == "" ? "None" : members[mb].fields[0].value)
							},
							{name: "Not Added",
							value: (members[mb].fields[1].value == "" ? "None" : members[mb].fields[1].value)
							}
						]
					}
					}).catch(e=> console.log(e));
				})
			})
		} else {
			msg.channel.createMessage("Please mention a user.");
		}
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.index = {
	help: ()=> "Index new selfroles.",
	usage: ()=> [" [role name] [1/0] - Indexes new role, either self-roleable (1) or mod-roleable (0)"],
	execute: (bot, msg, args)=>{
		if(args.length>1){
			var role_name = args.slice(0,-1).join(" ");
			var sar = args[args.length-1];
			console.log(role_name + ": " + sar);
			if(msg.guild.roles.find(r => r.name.toLowerCase() == role_name.toLowerCase())){
				var role_id = msg.guild.roles.find(r => r.name.toLowerCase() == role_name.toLowerCase()).id;
				bot.db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${role_id}'`,(err,rows)=>{
					if(err){
						console.log(err);
						msg.channel.createMessage("There was an error.");
					} else {
						if(rows.length>0){
							setTimeout(function(){
								switch(sar){
									case "1":
									bot.db.query(`UPDATE roles SET sar='${"1"}' WHERE srv_id='${msg.guild.id}' AND id='${role_id}'`,(err,rows)=>{
										if(err){
											console.log(err);
											msg.channel.createMessage("There was an error.");
										} else {
											msg.channel.createMessage("Self assignable role updated.")
										}
									})
									break;
									case "0":
									bot.db.query(`UPDATE roles SET sar='${"0"}' WHERE srv_id='${msg.guild.id}' AND id='${role_id}'`,(err,rows)=>{
										if(err){
											console.log(err);
											msg.channel.createMessage("There was an error.");
										} else {
											msg.channel.createMessage("Self assignable role updated.")
										}
									})
									break;
									default:
									msg.channel.createMessage("Please provide a 1 or a 0.\nUsage:\n`hh!admin roles add role name [1/0]`");
									break;
								}
							},500);
						} else {
							setTimeout(function(){
								switch(sar){
									case "1":
									bot.db.query(`INSERT INTO roles VALUES (?,?,?,?)`,[msg.guild.id,role_id,1,0],(err,rows)=>{
										if(err){
											console.log(err);
											msg.channel.createMessage("There was an error.");
										} else {
											msg.channel.createMessage("Self assignable role indexed.")
										}
									})
									break;
									case "0":
									bot.db.query(`INSERT INTO roles VALUES (?,?,?,?)`,[msg.guild.id,role_id,0,0],(err,rows)=>{
										if(err){
											console.log(err);
											msg.channel.createMessage("There was an error.");
										} else {
											msg.channel.createMessage("Role indexed.")
										}
									})
									break;
									default:
									msg.channel.createMessage("Please provide a 1 or a 0.\nUsage:\n`hh!admin roles add role name [1/0]`");
									break;
								}
							},500);
						}
					}
				})
				
			} else {
				msg.channel.createMessage("Role does not exist.");
			}
		} else {
			msg.channel.createMessage("Usage:\n`hh!admin index [role name] [1/0]`");
		}
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.create = {
	help: ()=> "Creates a role.",
	usage: ()=> [" [role name] - creates a new role with the given name, if one doesn't already exist"],
	execute: (bot, msg, args)=> {
		var name = args.join(" ");
		msg.guild.createRole({name: name});
		msg.channel.createMessage("Role created. Use the `hh!role edit` command to edit the role.");
	}
}

module.exports.subcommands.edit = {
	help: ()=> "Edits a role.",
	usage: ()=> [" [role name] color [color] - edits role's color",
				" [role name] name [new name] - edits role's name"],
	execute: (bot, msg, args)=> {
		var ind;
		var name;
		if(args.indexOf("color") > -1) {
			ind = args.indexOf("color");
			name = args.slice(0, ind).join(" ");
			var col = args[args.length-1];

			if(msg.guild.roles.find(r => r.name == name)){
				msg.guild.roles.find(r => r.name == name).edit({color: parseInt(col.replace("#",""),16)}).then(()=>{
					msg.channel.createMessage("Role edited.")
				}).catch(e => {
					console.log(e);
					msg.channel.createMessage("Something went wrong.")
				})
			} else {
				msg.channel.createMessage(`Couldn't find role ${name}.`)
			}
		} else if(args.indexOf("name") > -1) {
			ind = args.indexOf("name");
			name = args.slice(0, ind).join(" ");
			var nnm = args.slice(ind+1, args.length).join(" ");

			if(msg.guild.roles.find(r => r.name == name)){
				msg.guild.roles.find(r => r.name == name).edit({name: nnm}).then(()=>{
					msg.channel.createMessage("Role edited.")
				}).catch(e => {
					console.log(e);
					msg.channel.createMessage("Something went wrong.")
				})
			} else {
				msg.channel.createMessage(`Couldn't find role ${name}.`)
			}
		} else {
			msg.channel.createMessage("Please specify what to change.");
		}
	}
}

module.exports.subcommands.id = {
	help: ()=> "Fetches the ID of a role.",
	usage: ()=> " [role name] - returns ID of the role, if it exists",
	execute: (bot, msg, args)=> {
		var name = args.join(" ");
		if(msg.guild.roles.find(r => r.name == name)){
			msg.channel.createMessage("ID: " + msg.guild.roles.find(r => r.name == name).id)
		} else {
			msg.channel.createMessage("Role not found.")
		}
	}
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes a role.",
	usage: ()=> [" [role name] - deletes given role"],
	execute: (bot, msg, args)=> {
		var name = args.join(" ");
		if(msg.guild.roles.find(r => r.name == name)){
			msg.guild.roles.find(r => r.name == name).delete().then(()=> {
				msg.channel.createMessage("Role deleted.");
			}).catch(e => {
				console.log(e);
				msg.channel.createMessage("Something went wrong.")
			})
		} else {
			msg.channel.createMessage("Role not found.");
		}
	}
}