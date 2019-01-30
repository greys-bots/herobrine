/*

Steve Bot Version 2.0 Official [Herobrine] (REMOTE)
Begin work date: 07 September 2017
Official "birthday": 25 September 2017

---------------------------------------------------------------------------------------------
*/

const Eris = 		require("eris-additions")(require("eris")); //da lib
const fs =			require("fs"); //file stuff
const {Client} =	require("pg"); //postgres, for data things
const dblite =		require('dblite').withSQLite('3.8.6+'); //dblite, also for data things
const pimg =		require('pngjs-image'); //for image manipulation
const helptext =	require("./help.js"); //help text
const config =		require('./config.json'); //configs
const Texts =		require('./strings.json'); //json full of text for different things
const Util =		require("./utilities.js");

var cur_logs =		"";

const bot = new Eris.CommandClient(config.token,{},{
	name: "Herobrine",
	description: "Temporary test rewrite of Steve",
	owner: "The Grey Skies",
	prefix: config.prefix,
	defaultHelpCommand: false
});

//uncommenting the line below may cause "kill einvalid" errors on some computers;
//make sure the config is set up if you're getting issues
// dblite.bin = config.sqlite;

var db;

try{
	db = dblite("./data.sqlite","-header");
} catch(e){
	console.log(
		["Error opening database with dblite.",
		"You may need to set sqlite's location in config",
		"and uncomment the dblite.bin line in bot.js (line 32)"
		].join("\n") + "\nError:\n"+e);
	process.exit(1);
}


/***********************************
SETUP
***********************************/

const setup = async function(){

	db.query(".databases");
	db.query(`CREATE TABLE IF NOT EXISTS triggers (user_id TEXT, code TEXT, list TEXT, alias TEXT)`,(err,rows)=>{
		if(err){
			console.log("There was an error creating the triggers table.")
		}
	});
	db.query(`CREATE TABLE IF NOT EXISTS roles (srv_id TEXT, id TEXT, sar TEXT, bundle TEXT)`,(err,rows)=>{
		if(err){
			console.log("There was an error creating the roles table.")
		}
	});

	commands.test = await require("./test.js");
}


/***********************************
COMMANDS
***********************************/

const commands={};

commands.help = {
	help: () => "Use this to list commands or get help with a specific command",
	usage: () => ["- List commands and basic help functions."," [command] - Get help with that command"],
	execute: (msg,args)=>{
		if(args[0] && commands[args[0].toLowerCase()]){
			let command = args[0].toLowerCase();
			msg.channel.createMessage({embed:{
				title: "Herobrine - Help: "+command,
				description: commands[command].help() + 
							"\n\n**Usage**\n" +
							commands[command].usage().map(l => (bot.guildPrefixes[msg.guild.id] ? bot.guildPrefixes[msg.guild.id] : config.prefix[0]) + command + l)
							.join("\n") +
							(commands[command].desc!=undefined ? "\n\n"+commands[command].desc() : "") +
							"\n\nThis command is part of the **" + commands[command].module + "** module.",
				color: 16755455,
				footer:{
					icon_url: bot.user.avatarURL,
					text: "Arguments like [this] are required, arguments like <this> are optional."
				}
			}})
		} else {
			msg.channel.createMessage({embed: {
				title: "Herobrine - Help",
				description: "I'm Herobrine! This bot is multi-purpose and intended for a wide range of functions.",
				fields:[
					{name:"**FUN**",
					value: Object.keys(commands).filter(x => commands[x].module == "fun" && !commands[x].alias).map( c => "**"+(bot.guildPrefixes[msg.guild.id] ? bot.guildPrefixes[msg.guild.id] : config.prefix[0]) + c + "** - " + commands[c].help()).sort().join("\n")},
					{name:"**UTILITY**",
					value: Object.keys(commands).filter(x => commands[x].module == "utility" && !commands[x].alias).map( c => "**"+(bot.guildPrefixes[msg.guild.id] ? bot.guildPrefixes[msg.guild.id] : config.prefix[0]) + c + "** - " + commands[c].help()).sort().join("\n")}
					// {name:"****",
					// value: Object.keys(commands).filter(x => commands[x].module == "fun").map( c => "**"+(bot.guildPrefixes[msg.guild.id] ? bot.guildPrefixes[msg.guild.id] : config.prefix[0]) + c + "** - " + commands[c].help()).join("\n")},
					
				],
				color: 16755455,
				footer:{
					icon_url: bot.user.avatarURL,
					text: "Arguments like [this] are required, arguments like <this> are optional."
				}
			}});
		}
	},
	module: "utility"
}

commands.h = Object.assign({alias:true},commands.help);


//- - - - - - - - - - - Triggers - - - - - - - - - -

commands.trigs= {
	help: () => "List, register, add, and remove triggers.",
	usage: () => [" - List your trigger lists, if you have any.",
					" [code] - List triggers registered at that code.",
					" new - Creates a new list, using a handy menu.",
					" add [code] <triggers, to, add> - Adds triggers to a list. If no triggers are given, runs a menu.",
					" remove [code] <triggers, to, remove> - Removes triggers from a list. If no triggers are given, runs a menu.",
					" delete [code] - Deletes a trigger list."],
	execute: (msg,args) => {
		if(args[0]){
			let command = args.shift().toLowerCase();
			switch(command){
				case "new":
					let cd=Util.genCode(4,Texts.codestab);
					let listname = "";

					msg.channel.createMessage("Please enter a name/alias for the list");
					msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:20000,maxMatches:1}).then(tlname=>{
						if(tlname.length>0){
							if(tlname[0].content.toLowerCase()=="cancel"){ return msg.channel.createMessage("Action cancelled.") }
							listname=tlname[0].content;
							msg.channel.createMessage("Type (preferably, comma, separated) triggers to add to the list. You have 60 seconds to do this.").then(()=>{
								msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:60000,maxMatches:1}).then(trigs_received=>{
									if(trigs_received.length>0){
										if(trigs_received[0].content.toLowerCase()=="cancel"){ return msg.channel.createMessage("Action cancelled.")}
										db.query(`INSERT INTO triggers VALUES (?,?,?,?)`,[msg.author.id,cd,trigs_received[0].content,listname],(err,rows)=>{
											if(err){
												console.log(err);
												msg.channel.createMessage("There was an error.");
											} else {
												msg.channel.createMessage("List created. Code: "+cd);
											}
										});
									} else {
										msg.channel.createMessage("Action cancelled.");
									}
								})
							});
						} else {
							console.log("Error: no message received");
							msg.channel.createMessage("Action cancelled.");
						}
					})
					break;
				case "add":
					db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
						tl = rows[0];
						if(!tl){ return msg.channel.createMessage("List does not exist."); }
						if(!(tl.user_id == msg.author.id)){ return msg.channel.createMessage("That list doesn't belong to you.");}
						if(args.length > 1){
							db.query(`UPDATE triggers SET list='${tl.list},${args.slice(1).join(" ")}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
								msg.channel.createMessage("Appended to list.");
							})
							return;
						}
						msg.channel.createMessage("Write what you want to add.");
						msg.channel.awaitMessages(m=> m.author.id == msg.author.id,{time:60000,maxMatches:1}).then(resp=>{
							db.query(`UPDATE triggers SET list='${tl.list},${resp[0].content}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
								msg.channel.createMessage("Appended to list.")
							})
						})
					})
					break;
				case "remove":
					db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
						tl = rows[0];
						if(!tl){ return msg.channel.createMessage("List does not exist."); }
						if(!(tl.user_id == msg.author.id)){ return msg.channel.createMessage("That list doesn't belong to you.");}
						var tlist = tl.list.split(/,\s*/);
						if(args.length > 1){
							var rmlist = args.slice(1).join(" ");
							console.log(rmlist);
							rmlist = rmlist.split(/,\s*/);
							tlist = tlist.filter((t,ind)=>{
								var f = true;
								for(var i = 0; i < rmlist.length; i++){
									if(t == rmlist[i]){
										f = false;
									}
								}
								return f;
							})
							db.query(`UPDATE triggers SET list='${tlist}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
								msg.channel.createMessage("Removed from list.").then(()=>{
									db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
										nlist=rows[0];
										if(!nlist){ console(`Error finding list ${args[0].toLowerCase()} after removing triggers.`) }
										if(nlist.list.replace(/,*/g,"")==""||nlist.list==undefined){
											db.query(`DELETE FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
												msg.channel.createMessage("List is empty; deleted.");
											})
										}
									})
								})
							})
							return;
						}
						msg.channel.createMessage("Write what you want to remove.");
						msg.channel.awaitMessages(m=> m.author.id == msg.author.id,{time:60000,maxMatches:1}).then(resp=>{
							var rmlist = resp[0].content.split(/,\s*/);
							tlist = tlist.filter((t,ind)=>{
								var f = true;
								for(var i = 0; i < rmlist.length; i++){
									if(t == rmlist[i]){
										f = false;
									}
								}
								return f;
							})
							setTimeout(function(){
								db.query(`UPDATE triggers SET list='${tlist}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
									msg.channel.createMessage("Removed from list.").then(()=>{
										db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
											nlist=rows[0];
											if(!nlist){ console(`Error finding list ${args[0].toLowerCase()} after removing triggers.`) }
											if(nlist.list.replace(/,*/g,"")==""||nlist.list==undefined){
												db.query(`DELETE FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
													msg.channel.createMessage("List is empty; deleted.");
												})
											}
										})
									})
								})
							},500)

						})
					})
					break;
				case "delete":
					db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
						tg=rows[0];
						if(!tg){ return msg.channel.createMessage("That list doesn't exist."); }
						if(!(tg.user_id == msg.author.id)){ return msg.channel.createMessage("That list does't belong to you.")}
						msg.channel.createMessage(`Are you sure you want to delete this set? Enter \`${tg.code}\` to delete it.`)
						msg.channel.awaitMessages(m=> m.author.id == msg.author.id,{time:10000,maxMatches:1}).then(resp=>{
							if(resp[0].content.toLowerCase() == tg.code){
								db.query(`DELETE FROM triggers WHERE code='${tg.code}'`,(err,rows)=>{
									if(err) console.log(err);
									else msg.channel.createMessage("Deleted.");
								})
							}
						})
					})
					break;
				default:
					db.query(`SELECT * FROM triggers WHERE code='${command}'`,(err,rows)=>{
						list=rows[0];
						if(list){
							msg.channel.createMessage({embed:{
								title:"Triggers for "+list.alias,
								description: list.list.split(/,\s*/).join("\n"),
								color: 11433333
							}})
						} else {
							msg.channel.createMessage("That list wasn't found.");
						}
					});
					break;
			}
		} else {
			db.query(`SELECT * FROM triggers WHERE user_id='${msg.author.id}'`,(err,rows)=>{
				if(err){
					console.log(err)
				} else {
					msg.channel.createMessage({embed:{
						title:"triggers - (alias: code)",
						description: (rows.map(t=>t.alias+": "+t.code).length > 0 ? rows.map(t=>t.alias+": "+t.code).join("\n") : "None found.")
					}})
				}
			})
		}
	},
	module: "utility"
}


//- - - - - - - - - - Roles - - - - - - -  - -

commands.role = {
	help: ()=> "Add and remove self roles.",
	usage: ()=> ["s - list available roles",
				" add [comma, separated, role names] - adds [a] self role(s)",
				" remove [comma, separated, role names] - removes [a] self role(s)",
				" list - Lists available roles."],
	desc: () => "This command can only be used in guilds.",
	execute: (msg,args)=>{
		if(args[0] && msg.guild!=undefined){
			var command = args.shift().toLowerCase();
			switch(command){
				case "add":
					let rls = args.join(" ").split(/,\s*/g);
					let nad = [];
					let ad = [];
					let addRoles = async function (){
						await Promise.all(rls.map((r)=>{
							if(msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase())){
								db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase()).id}'`,async (err,rows)=>{
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
					break;
				case "remove":
					let rlstrmv = args.join(" ").split(/,\s*/g);
					let nrem = [];
					let rem = [];
					let rmvRoles = async function (){
						await Promise.all(rlstrmv.map((r)=>{
							if(msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase())){
								db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase()).id}'`,async (err,rows)=>{
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
								nad.push({name:r,reason:"Role does not exist."});
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
									{name:"Added",value: (rem.length>0 ? rem.join("\n") : "None")},
									{name:"Not added: Reason",value: (nrem.length>0 ? nrem.map(nar=>nar.name+": "+nar.reason).join("\n") : "None")}
									]
								}
							});
						})
					}
					rmvRoles();
					break;
				case "list":
					db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
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
						}
						db.query("BEGIN TRANSACTION");
						rows.forEach(r =>{
							if(!msg.guild.roles.find(rl => rl.id == r.id)){
								db.query(`DELETE FROM roles WHERE id='${r.id}'`);
							}
						})
						db.query("COMMIT");
					});
					break;
				default:
					break;
			}
		} else {
			commands.help.execute(msg,["role"]);
		}
	},
	module: "utility"
}

commands.roles = {
	help: ()=> "List all available self roles for a guild.",
	usage: ()=> [" - Lists available roles."],
	execute: (msg,args)=>{
		db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
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
			}
			db.query("BEGIN TRANSACTION");
			rows.forEach(r =>{
				if(!msg.guild.roles.find(rl => rl.id == r.id)){
					db.query(`DELETE FROM roles WHERE id='${r.id}'`);
				}
			})
			db.query("COMMIT");
		});
	},
	module: "utility"
}


//- - - - - - - - - - Pings - - - - - - - - - -

commands.ping= {
	help: ()=> "Ping the Boy:tm:",
	usage: ()=> [" - Returns a random pingy-pongy response."],
	execute: (msg,args)=>{
		var pongs = ["pong!","peng!","pung!","pang!"];
		msg.channel.createMessage(pongs[Math.floor(Math.random()*pongs.length)]);
	},
	module: "fun"
}

commands["ping!"] = Object.assign({alias:true},commands.ping);

//- - - - - - - - - - Random - - - - - - - - - - - -

commands.random = {
	help: ()=>"Gives a random number.",
	usage: ()=> [" <number> - Gives a number between 1 and 10, or the number provided."],
	execute: (msg,args)=>{
		var max=(isNaN(args[0]) ? 10 : args[0]);
		var num=Math.floor(Math.random() * max);
		var nums=num.toString().split("");

		msg.channel.createMessage("Your number:\n"+nums.map(n => ":"+Texts.numbers[eval(n)] + ":").join(""));
	},
	module: "utility"
}

//- - - - - - - - - - Lovebomb - - - - - - - - - -

commands.lovebomb = {
	help: () => "Get a little bit of love from Herobrine!",
	usage: () => [" - sends about 5 messages in a row that are meant to be affirming"],
	execute: (msg,args) =>{
		var lb = -1000;
		Texts.lovebombs.forEach(async t=>{
			lb+=1000;
			setTimeout(()=>{
				msg.channel.sendTyping();
			},lb)
			setTimeout(()=>{
				msg.channel.createMessage(t.replace("msg.author.username",msg.author.username));
			},lb+500)
		});
	},
	module: "fun"
}

//- - - - - - - - - - - Prefix - - - - - - - - - -

// commands.prefix=bot.registerCommand("prefix",(msg,args)=>{

// 	if(args[0]!=undefined && m){
// 		bot.registerGuildPrefix(msg.guild.id,[args[0]].concat(config.prefix));
// 		msg.channel.createMessage("Guild prefix updated.")
// 	} else {
// 		bot.registerGuildPrefix(msg.guild.id,"hh!")
// 		msg.channel.createMessage("Guild prefix reset.")
// 	}

// },{
// 	description: "Sets guild prefix",
// 	fullDescription: "Sets prefix for the guild you're in. The defaults still work, of course."
// })

//- - - - - - - - - - Eval - - - - - - - - - -
commands.eval= {
	help: ()=>"Evaluate javascript code.",
	usage: ()=>[" [code] - Evaluates given code."," prm [code] - Evaluates given code, and any returned promises."],
	desc: ()=>"Only the bot owner can use this command.",
	execute: (msg, args)=>{
		if(!config.accepted_ids.includes(msg.author.id)){ return msg.channel.createMessage("Only the bot owner can use this command."); }
		if(args[0] == "prm"){
			async function f(){

			try {
				const promeval = args.join(" ");
				let evlp = await eval(promeval);

				if(typeof(evlp)!=="string"){
					evlp=require("util").inspect(evlp);
				}

				msg.channel.createMessage(Util.cleanText(evlp));
			} catch (err) {
				if(err){console.log(err)}
			}

		}

		f();

		} else {
			try {
				const toeval = args.join(" ");
				let evld = eval(toeval);

				if(typeof(evld)!=="string"){
					evld=require("util").inspect(evld);
				}

				msg.channel.createMessage(Util.cleanText(evld));
			} catch (err) {
				if(err){console.log(err)}
			};
		}
		
	},
	module: "admin"
}

//---------------------------------------------- FUN ---------------------------------------------------
//======================================================================================================
//------------------------------------------------------------------------------------------------------

//- - - - - - - - - - What's up - - - - - - - - - -
commands.whats={
	help: ()=> "Return a random phrase about what's up.",
	usage: ()=>[" - Return random tidbit."],
	execute: (msg,args)=>{
		if(!args[0]){ return }
		if(args[0].match(/up\?*/)){
			msg.channel.createMessage(Util.randomText(Texts.wass));
		}
	},
	module: "fun"
}

commands["what's"] = Object.assign({alias:true},commands.whats);

//--------------------------------------------- Admin --------------------------------------------------
//======================================================================================================
//------------------------------------------------------------------------------------------------------


// commands.admin = bot.registerCommand("admin",(msg,args)=>{
// 	msg.channel.createMessage({embed: helptext.adhelp});
// });

// bot.registerCommandAlias("ad","admin");
// bot.registerCommandAlias("*","admin");

// commands.adroles = commands.admin.registerSubcommand("roles",(msg,args)=>{
// 	db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
// 		if(rows.length>0){
// 			msg.channel.createMessage({
// 				embed: {
// 					title:"Roles",
// 					fields:[{
// 						name:"\\~\\~\\* Assignable Roles \\*\\~\\~",
// 						value:rows.map(r => (msg.guild.roles.find(rl => rl.id == r.id) && r.sar==1 ? msg.guild.roles.find(rl => rl.id == r.id).name.toLowerCase() : null)).filter(x=>x!=null).sort().join("\n")
// 					},{
// 						name:"\\~\\~\\* Mod-Only Roles \\*\\~\\~",
// 						value:rows.map(r => (msg.guild.roles.find(rl => rl.id == r.id) && r.sar==0 ? msg.guild.roles.find(rl => rl.id == r.id).name.toLowerCase() : null)).filter(x=>x!=null).sort().join("\n")
// 					}]
// 				}
// 			});
// 		}
// 		db.query("BEGIN TRANSACTION");
// 		rows.forEach(r =>{
// 			if(!msg.guild.roles.find(rl => rl.id == r.id)){
// 				db.query(`DELETE FROM roles WHERE id='${r.id}'`);
// 			}
// 		})
// 		db.query("COMMIT");
// 	})
// })

// commands.adroles.registerSubcommand("index",(msg,args)=>{
// 	if(!msg.member.permission.has("manageGuild") || !msg.member.permission.has("administrator")) return msg.channel.createMessage("You do not have permission to use this command.");
// 	if(args.length>1){
// 		var role_name = args.slice(0,-1).join(" ");
// 		var sar = args[args.length-1];
// 		console.log(role_name + ": " + sar);
// 		if(msg.guild.roles.find(r => r.name.toLowerCase() == role_name.toLowerCase())){
// 			var role_id = msg.guild.roles.find(r => r.name.toLowerCase() == role_name.toLowerCase()).id;
// 			db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${role_id}'`,(err,rows)=>{
// 				if(err){
// 					console.log(err);
// 					msg.channel.createMessage("There was an error.");
// 				} else {
// 					if(rows.length>0){
// 						setTimeout(function(){
// 							switch(sar){
// 								case "1":
// 									db.query(`UPDATE roles SET sar='${"1"}' WHERE srv_id='${msg.guild.id}' AND id='${role_id}'`,(err,rows)=>{
// 										if(err){
// 											console.log(err);
// 											msg.channel.createMessage("There was an error.");
// 										} else {
// 											msg.channel.createMessage("Self assignable role updated.")
// 										}
// 									})
// 									break;
// 								case "0":
// 									db.query(`UPDATE roles SET sar='${"0"}' WHERE srv_id='${msg.guild.id}' AND id='${role_id}'`,(err,rows)=>{
// 										if(err){
// 											console.log(err);
// 											msg.channel.createMessage("There was an error.");
// 										} else {
// 											msg.channel.createMessage("Self assignable role updated.")
// 										}
// 									})
// 									break;
// 								default:
// 									msg.channel.createMessage("Please provide a 1 or a 0.\nUsage:\n`hh!admin roles add role name [1/0]`");
// 									break;
// 							}
// 						},500);
// 					} else {
// 						setTimeout(function(){
// 							switch(sar){
// 								case "1":
// 									db.query(`INSERT INTO roles VALUES (?,?,?,?)`,[msg.guild.id,role_id,1,0],(err,rows)=>{
// 										if(err){
// 											console.log(err);
// 											msg.channel.createMessage("There was an error.");
// 										} else {
// 											msg.channel.createMessage("Self assignable role indexed.")
// 										}
// 									})
// 									break;
// 								case "0":
// 									db.query(`INSERT INTO roles VALUES (?,?,?,?)`,[msg.guild.id,role_id,0,0],(err,rows)=>{
// 										if(err){
// 											console.log(err);
// 											msg.channel.createMessage("There was an error.");
// 										} else {
// 											msg.channel.createMessage("Role indexed.")
// 										}
// 									})
// 									break;
// 								default:
// 									msg.channel.createMessage("Please provide a 1 or a 0.\nUsage:\n`hh!admin roles add role name [1/0]`");
// 									break;
// 							}
// 						},500);
// 					}
// 				}
// 			})
			
// 		} else {
// 			msg.channel.createMessage("Role does not exist.");
// 		}
// 	} else {
// 		msg.channel.createMessage("Usage:\n`hh!admin roles add role name [1/0]`");
// 	}
// })


//************************************** BOT EVENTS **************************************************
//----------------------------------------------------------------------------------------------------
//****************************************************************************************************


bot.on("ready",()=>{
	console.log("Ready.");
	let now = new Date();
	let ndt = `${(now.getMonth() + 1).toString().length < 2 ? "0"+ (now.getMonth() + 1) : now.getMonth()+1}.${now.getDate().toString().length < 2 ? "0"+ now.getDate() : now.getDate()}.${now.getFullYear()}`;
	if(!fs.existsSync(`./logs/${ndt}.log`)){
		fs.writeFile(`./logs/${ndt}.log`,"===== LOG START =====\r\n=== BOT READY ===",(err)=>{
			if(err) console.log(`Error while attempting to write log ${ndt}\n`+err);
		});
		cur_logs = ndt;
	} else {
		fs.appendFile(`./logs/${ndt}.log`,"\n=== BOT READY ===",(err)=>{
			if(err) console.log(`Error while attempting to apend to log ${ndt}\n`+err);
		});
		cur_logs = ndt;
	}
})

//- - - - - - - - - - MessageCreate - - - - - - - - - -
bot.on("messageCreate",(msg)=>{
	if(msg.content.toLowerCase()=="hey herobrine"){
		msg.channel.createMessage("That's me!");
		return;
	}

	//if(new RegExp("good\s").test(msg.content.toLowerCase()))

	if(new RegExp("^"+config.prefix.join("|")).test(msg.content.toLowerCase()) || (msg.guild!=undefined && bot.guildPrefixes[msg.guild.id] && msg.content.toLowerCase().startsWith(bot.guildPrefixes[msg.guild.id][0]))){
		let now = new Date();
		let ndt = `${(now.getMonth() + 1).toString().length < 2 ? "0"+ (now.getMonth() + 1) : now.getMonth()+1}.${now.getDate().toString().length < 2 ? "0"+ now.getDate() : now.getDate()}.${now.getFullYear()}`;
		if(!fs.existsSync(`./logs/${ndt}.log`)){
			fs.writeFile(`./logs/${ndt}.log`,"===== LOG START =====",(err)=>{
				console.log(`Error while attempting to write log ${ndt}\n`+err);
			});
			cur_logs = ndt;
		} else {
			cur_logs = ndt;
		}
		console.log(`Time: ${ndt} at ${now.getHours().toString().length < 2 ? "0"+ now.getHours() : now.getHours()}${now.getMinutes()}\nMessage: ${msg.content}\nUser: ${msg.author.username}#${msg.author.discriminator}\nGuild: ${(msg.guild!=undefined ? msg.guild.name + "(" +msg.guild.id+ ")" : "DMs")}`)
		fs.appendFile(`./logs/${ndt}.log`,`\r\nTime: ${ndt} at ${now.getHours().toString().length < 2 ? "0"+ now.getHours() : now.getHours()}${now.getMinutes()}\r\nMessage: ${msg.content}\r\nUser: ${msg.author.username}#${msg.author.discriminator}\r\nGuild: ${(msg.guild!=undefined ? msg.guild.name + "(" +msg.guild.id+ ")" : "DMs")}\r\n--------------------`,(err)=>{
			if(err) console.log(`Error while attempting to write log ${ndt}\n`+err);
		});

		let args = msg.content.replace(new RegExp("^"+config.prefix.join("|")+((msg.guild != undefined && bot.guildPrefixes[msg.guild.id]) ? "|"+bot.guildPrefixes[msg.guild.id] : ""),"i"), "").split(" ");
		let cmd = args.shift();
		console.log("Command: "+cmd+"\nArgs: "+args.join(", "));
		if(commands[cmd.toLowerCase()]){
			commands[cmd.toLowerCase()].execute(msg, args);
		}

	}
})


//----------------------------------------------------------------------------------------------------//

setup();
bot.connect()
	.catch(e => console.log("Trouble connecting...\n"+e))
