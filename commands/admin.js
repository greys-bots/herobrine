const config = require("../config.json");
const Util = require("../utilities.js");

module.exports = {
	help: ()=> "For admin commands. Use `hh!admin help` or `hh!help admin` for more info.",
	usage: ()=>[" - displays this help",
				" ban [userID] - [hack]bans user from the server",
				" index [role name] [1/0] - indexes self and mod-only roles",
				" roles - lists all indexed roles (selfroleable and mod-only) for the server",
				" role [add/remove] [roles, to, handle] [@user @member] - adds/removes roles from users",
				" prune <num> - prunes [num] messages from the channel (100 default)"],
	execute: (bot, msg, args)=>{
		bot.commands.help.execute(bot,msg,["admin"]);
	},
	module: "admin",
	subcommands: {},
	guildOnly: true,
	alias: ["ad","*"]
}

//- - - - - - - - - - - Prefix - - - - - - - - - -

module.exports.subcommands.prefix = {
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
					bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?)`,[msg.guild.id,args[0],{},"",[],"",{}],(err,rows)=>{
						if(err) console.log(err);
					})
				}
				// console.log(bot.server_configs[msg.guild.id]);
				Util.reloadConfig(bot, msg.guild.id);
				msg.channel.createMessage(("Prefix changed."));
			}
		})
	}
}

// - - - - - - - - - - - Ban - - - - - - - - - - -

module.exports.subcommands.ban = {
	help: ()=> "[Hack]bans members.",
	usage: ()=> [" [userID] - Bans member with that ID."],
	execute: async (bot, msg, args)=>{
		var membs = args.join(" ").split(/,*\s+|\n+/);
		var succ = [];
		async function banMembers (){
			return await Promise.all(membs.map(async (m) => {
				console.log(succ);
				await bot.getRESTUser(m).then(async (u)=>{
					await msg.guild.getBans().then(b=>{
						console.log(b);
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
			console.log(succ)
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
	guildOnly: true
}

// - - - - - - - - - - - Prune  - - - - - - - - - - -
module.exports.subcommands.prune = {
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
	alias: ["delete"]
}

module.exports.subcommands.prune.subcommands.safe = {
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
	guildOnly: true
}


// - - - - - - - - - - - Adroles - - - - - - - - - - -

module.exports.subcommands.roles = {
	help: ()=> "List all indexed roles for a server.",
	usage: ()=> [" - lists all indexed roles for the server"],
	execute: (bot, msg, args)=> {
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
	permissions: ["manageRoles"],
	guildOnly: true
}

module.exports.subcommands.role = {
	help: ()=> "Create, delete, edit, add, and remove roles.",
	usage: ()=> [" - shows this help",
				" create [role name] - creates new role",
				" delete [role name] - deletes existing role",
				" edit [role name] [color/name/etc] [new value] - edits existing role",
				" add [comma, separated, role names] [@memberping] - adds roles to specified member",
				" remove [comma, separated, role names] [@memberping] - removes roles from specified member"],
	execute: (bot, msg, args) =>{
		commands.help.execute(msg,["admin","role"])
	},
	subcommands: {}
}

module.exports.subcommands.role.subcommands.add = {
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
	permissions: ["manageRoles","manageMembers"],
	guildOnly: true
}

module.exports.subcommands.role.subcommands.remove = {
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
	permissions: ["manageRoles","manageMembers"],
	guildOnly: true
}


module.exports.subcommands.role.subcommands.index = {
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

// - - - - - - - - - - Welcome - - - - - - - - - -

module.exports.subcommands.welcome = {
	help: ()=> "Used to edit server welcoming protocol",
	usage: ()=> [" channel [channel] - sets welcome channel",
				" autoroles [comma, separated, role names] - default roles to add to members",
				" message [message goes here] - sets welcome message (use `hh!help admin welcome message` for more info"],
	execute: async (bot, msg, args)=>{
		msg.channel.createMessage("WIP");
	}
}