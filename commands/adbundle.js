module.exports = {
	help: "Create, delete, add, remove, and get info on role bundles.",
	usage: [" create [bundle name] [0|1] - runs a creation menu. the 0 or 1 is for self-assignability",
			" delete [bundle name] - deletes a given bundle",
			" add [bundle name] [@member @ping] - adds bundle to mentioned user(s)",
			" remove [bundle name] [@member @ping] - removes bundle from mentioned user(s)",
			" info [bundle name] - gets info on an existing bundle"],
	examples: [
			   "hh!adbundle create test bundle 1",
			   "hh!adbundle delete test bundle",
			   "hh!adbundle add test bundle @thisperson @thatperson",
			   "hh!adbundle remove test bundle @thisperson @thatperson"
			  ],
	subcommands: {},
	permissions: ["manageRoles"],
	guildOnly: true,
	module: "admin",
	alias: ["adbundles"]
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

module.exports.subcommands.create = {
	help: ()=> "Runs a menu for creating bundles.",
	usage: ()=> [" [bundle name] [0/1] - creates a bundle with the given name and availability (1 = mod-only)"],
	execute: (bot, msg, args)=> {
		var name = args.slice(0,-1).join(" ").toLowerCase();
		var sa = args[args.length-1];
		if(sa != "0" && sa != 1) return msg.channel.createMessage("Please provide a 0 or 1 for self-assignability.");
		bot.db.query(`SELECT * FROM bundles WHERE srv_id='${msg.guild.id}' AND name='${name}'`,(err, rows)=>{
			if(err) {
				console.log(err);
				msg.channel.createMessage("Something went wrong.");
			} else {
				if(rows[0]){
					msg.channel.createMessage("Bundle with that name already exists.")
				} else {
					msg.channel.createMessage("Please enter comma, separated, role names for the bundle. You have 30 seconds to do this.");
					msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time:30000,maxMatches:1}).then(async res => {
						if(res[0]){
							var roles = res[0].content.split(/,\s*/);
							var rls = [];
							await Promise.all(roles.map(r => {
								var tmp = msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase());
								if(tmp) {
									rls.push({suc: true, name: tmp.name, id: tmp.id})
								} else {
									rls.push({suc: false, name: r, reason: "Does not exist."})
								}
								return new Promise((res,rej)=>{
									setTimeout(res(1),100)
								})
							})).then(()=>{
								var tmp2 = rls.map(r => r.suc ? r.id : null)
											.filter(x => x!=null).join(", ");
								bot.db.query(`INSERT INTO bundles VALUES (?,?,?,?)`,[msg.guild.id, name, tmp2, sa],(err,rows)=>{
									if(err) {
										console.log(err);
										msg.channel.createMessage("Something went wrong.");
									} else {
										msg.channel.createMessage({embed: {
											title: "Results",
											fields: [
												{name: "Indexed", value: rls.map(r => r.suc ? r.name : null)
																	.filter(x => x!=null).sort().join("\n") || "None"},
												{name: "Not indexed: Reason", value: rls.map(r => !r.suc ? r.name + ": " + r.reason : null)
																	.filter(x => x!=null).sort().join("\n") || "None"}
											]
										}})
									}
								})
							}).catch(e => {
								console.log(e);
								msg.channel.createMessage("Something went wrong.");
							})
						} else {
							msg.channel.createMessage("Action cancelled.")
						}
					})
				}
			}
		})
	}
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes a bundle.",
	usage: ()=> [" [bundle name] - deletes given bundle"],
	execute: (bot, msg, args)=> {
		var name = args.join(" ").toLowerCase();
		bot.db.query(`SELECT * FROM bundles WHERE srv_id='${msg.guild.id}' AND name='${name}'`,(err,rows)=>{
			if(err) {
				console.log(err);
				msg.channel.createMessage("Something went wrong.")
			} else {
				if(rows[0]){
					bot.db.query(`DELETE FROM bundles WHERE srv_id='${msg.guild.id}' AND name='${name}'`,(err,rows)=>{
						if(err) {
							console.log(err);
							msg.channel.createMessage("Something went wrong.");
						} else {
							msg.channel.createMessage("Bundle deleted.");
						}
					})
				} else {
					msg.channel.createMessage("That bundle does not exist.")
				}
			}
		})
	}
}

module.exports.subcommands.add = {
	help: ()=> "Add bundles to mentioned users.",
	usage: ()=>[" [bundle name] [@user @mentions] - adds roles to these users"],
	execute: async (bot, msg, args)=>{
		if(msg.mentions.length > 0){
			var l = msg.mentions.length;
			var ments = args.slice(-l);
			var name = args.slice(0,-l).join(" ").toLowerCase();
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

					bot.db.query(`SELECT * FROM bundles WHERE srv_id='${msg.guild.id}' AND name='${name}'`,async (err,rows)=>{
						if(err){
							console.log(err);
							msg.channel.createMessage("There was an error.");
						} else if(rows[0]) {
							var rta = rows[0].roles.split(", ");
							await Promise.all(rta.map((r)=>{
								var tmp = msg.guild.roles.find(rl => rl.id == r);
								if(tmp){
									if(member.roles.includes(tmp.id)){
										members[m].fields[1].value += tmp.name + " - member already has role.\n";
									} else {
										member.addRole(tmp.id);
										members[m].fields[0].value += tmp.name + "\n";
									}
								} else {
									members[m].fields[1].value += r + " - role does not exist.\n";
								}
								return new Promise((resolve,reject)=>{
									setTimeout(()=>{
										resolve("done");
									},100);
								});
							}))
						} else {
							members[m].description = "Bundle does not exist.";
							members[m].fields = null;
						}
					})
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
	help: ()=> "Add bundles to mentioned users.",
	usage: ()=>[" [bundle name] [@user @mentions] - adds roles to these users"],
	execute: async (bot, msg, args)=>{
		if(msg.mentions.length > 0){
			var l = msg.mentions.length;
			var ments = args.slice(-l);
			var name = args.slice(0,-l).join(" ").toLowerCase();
			var members = {};
			await Promise.all(ments.map(async m=>{
				var member = await msg.guild.members.find(mb => mb.mention == m || mb.user.mention == m);
				if(member){
					members[m] = {
						title: "**"+member.username+"**",
						fields: [ 
						{name: "Removed",
						value: ""},
						{name: "Not Removed",
						value: ""}
						]
					}

					bot.db.query(`SELECT * FROM bundles WHERE srv_id='${msg.guild.id}' AND name='${name}'`,async (err,rows)=>{
						if(err){
							console.log(err);
							msg.channel.createMessage("There was an error.");
						} else if(rows[0]) {
							var rta = rows[0].roles.split(", ");
							await Promise.all(rta.map((r)=>{
								var tmp = msg.guild.roles.find(rl => rl.id == r);
								if(tmp){
									if(!member.roles.includes(tmp.id)){
										members[m].fields[1].value += tmp.name + " - member already doesn't have role.\n";
									} else {
										member.removeRole(tmp.id);
										members[m].fields[0].value += tmp.name + "\n";
									}
								} else {
									members[m].fields[1].value += r + " - role does not exist.\n";
								}
								return new Promise((resolve,reject)=>{
									setTimeout(()=>{
										resolve("done");
									},100);
								});
							}))
						} else {
							members[m].description = "Bundle does not exist.";
							members[m].fields = null;
						}
					})
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
							{name: "Removed",
							value: (members[mb].fields[0].value == "" ? "None" : members[mb].fields[0].value)
							},
							{name: "Not Removed",
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