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

const bot = new Eris.CommandClient(config.token,{restMode: true},{
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

	commands.test = await require("./commands/test.js");
	commands.trigs = await require("./commands/trigs.js");
}

const cmdHandle = async function(clist,cmd,msg,args,lastcmd,lastargs){
	cmd = (clist.aliases && clist.aliases.filter(c => c.alias == cmd.toLowerCase()).length > 0 ? clist.aliases.filter(c => c.alias == cmd.toLowerCase())[0].base : cmd.toLowerCase());
	if(clist[cmd]){
		if(args[0] == undefined || args[0]=="" || clist[cmd].subcommands == undefined || Object.keys(clist[cmd].subcommands).length == 0){
			if(clist[cmd].guildOnly && !msg.guild ) return msg.channel.createMessage("This command can only be used in guilds.");
			if(clist[cmd].permissions != undefined){
				await Promise.all(clist[cmd].permissions.map(p=>{
					if(msg.member.permission.has(p)){
						return new Promise((res,rej)=>{
							setTimeout(res("passed"),100)
						})
					} else {
						return new Promise((res,rej)=>{
							setTimeout(rej("failed"),100)
						})
					}
				})).then(()=>{
					clist[cmd].execute(msg,args);
				}).catch(e=>{
					console.log(e);
					msg.channel.createMessage("You do not have permission to use that command.");
				})
			} else {
				clist[cmd].execute(msg,args);
			}
		} else if(clist[cmd].subcommands){
			cmdHandle(clist[cmd].subcommands,args.slice(0,1).toString(),msg,args.slice(1),clist[cmd],args);
		}
	} else {
		if(lastcmd){
			lastcmd.execute(msg,lastargs);
		} else {
			msg.channel.createMessage("That command does not exist.");
		}
	}
}


/***********************************
COMMANDS
***********************************/

const commands={};
commands.aliases = [];

commands.help = {
	help: () => "Use this to list commands or get help with a specific command",
	usage: () => ["- List commands and basic help functions."," [command] - Get help with that command"],
	execute: (msg,args)=>{
		let cmdname = (args[0] ? args[0].toLowerCase() : "");
		let command;
		let parentcmd;
		let parentcmdname;
		if(args[0] && (commands[cmdname] || commands.aliases.filter(x => x.alias == cmdname).length > 0)){
			if(commands.aliases.filter(x => x.alias == cmdname).length > 0){
				command = commands[commands.aliases.filter(x => x.alias == cmdname)[0].base];
			} else {
				command = commands[cmdname];
			}
			if(args[1] && command.subcommands != undefined && command.subcommands[args[1].toLowerCase()] != undefined){
				parentcmd = command;
				parentcmdname = cmdname;
				command = command.subcommands[args[1].toLowerCase()];
				cmdname = args[1].toLowerCase();
			}
			msg.channel.createMessage({embed:{
				title: "Herobrine - Help: "+ (parentcmdname != undefined ? parentcmdname + " - " : "") + cmdname,
				description: command.help() + 
				"\n\n**Usage**\n" +
				command.usage().map(l => (bot.guildPrefixes[msg.guild.id] ? bot.guildPrefixes[msg.guild.id] : config.prefix[0]) + (parentcmd != undefined ? parentcmdname + " " : "") + cmdname + l)
				.join("\n") +
							// (command.subcommands ? "\n\n**Subcommands**\n" + Object.keys(command.subcommands).map(sc => "**" + sc + "**" + " - " + commands[command].subcommands[sc].help()).join("\n") : "") +
							(command.desc!=undefined ? "\n\n"+command.desc() : "") +
							(command.module!=undefined || parentcmd.module!=undefined ? "\n\nThis command is part of the **" + (command.module || parentcmd.module) + "** module." : ""),
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
				value: Object.keys(commands).filter(x => commands[x].module == "utility" && !commands[x].alias).map( c => "**"+(bot.guildPrefixes[msg.guild.id] ? bot.guildPrefixes[msg.guild.id] : config.prefix[0]) + c + "** - " + commands[c].help()).sort().join("\n")},
				{name:"**ADMIN**",
				value: Object.keys(commands).filter(x => commands[x].module == "admin").map( c => "**"+(bot.guildPrefixes[msg.guild.id] ? bot.guildPrefixes[msg.guild.id] : config.prefix[0]) + c + "** - " + commands[c].help()).join("\n")},

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

commands.aliases.push({base: "help", alias: "h"});

//- - - - - - - - - - Roles - - - - - - -  - -

commands.role = {
	help: ()=> "Add and remove self roles.",
	usage: ()=> [" - display this help text","s - list available roles"],
	desc: () => "This command can only be used in guilds.",
	execute: (msg,args)=>{
		commands.help.execute(msg,["role"]);
	},
	module: "utility",
	subcommands: {},
	guildOnly: true
}

commands.role.subcommands.list = {
	help: ()=> "Lists available roles for a server.",
	usage: ()=> [" - Lists all selfroles for the server"],
	execute: (msg,args)=>{
		db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
			if(rows.length>0){
				msg.channel.createMessage({
					embed: {
						fields:[{
							name:"\\~\\~\\* Available Roles \\*\\~\\~",
							value:(rows.map(r => {if(msg.guild.roles.find(rl => rl.id == r.id) && r.sar == "1") return msg.guild.roles.find(rl => rl.id == r.id).name.toLowerCase();})
								.filter(x => x!=null)
								.sort()
								.join("\n") || "None")
						}]
					}
				});
			} else {
				msg.channel.createMessage("There are no roles indexed for this server.")
			}
			db.query("BEGIN TRANSACTION");
			rows.forEach(r =>{
				if(!msg.guild.roles.find(rl => rl.id == r.id)){
					db.query(`DELETE FROM roles WHERE id='${r.id}'`);
				}
			})
			db.query("COMMIT");
		});
	}
}

commands.role.subcommands.remove = {
	help: ()=> "Removes a selfrole.",
	usage: ()=> [" [comma, separated, role names] - Removes given roles, if applicable"],
	execute: (msg,args)=>{
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
	}
}

commands.role.subcommands.add = {
	help: ()=> "Adds selfroles.",
	usage: ()=> [" [comma, separated, role names] - Adds given roles, if available"],
	execute: (msg,args)=>{
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
			} else {
				msg.channel.createMessage("There are no indexed roles for this server.");
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
	module: "utility",
	guildOnly: true
}


//- - - - - - - - - - Pings - - - - - - - - - -

commands.ping = {
	help: ()=> "Ping the Boy:tm:",
	usage: ()=> [" - Returns a random pingy-pongy response."],
	execute: (msg,args)=>{
		var pongs = ["pong!","peng!","pung!","pang!"];
		msg.channel.createMessage(pongs[Math.floor(Math.random()*pongs.length)]);
	},
	module: "fun",
	subcommands: {}
}

commands.ping.subcommands.test = {
	help: ()=> "Test the Boy:tm:",
	usage: ()=> [" - yeet"],
	execute: (msg,args)=>{
		var yeets = ["yeet!","yate!","yote!","yute!", "yite!"];
		msg.channel.createMessage(yeets[Math.floor(Math.random()*yeets.length)]);
	},
	module: "fun"
}

commands.aliases.push({base:"ping",alias:"ping!"});

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
commands.eval = {
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
//368245507744727054

commands.admin = {
	help: ()=> "For admin commands. Use `hh!admin help` or `hh!help admin` for more info.",
	usage: ()=>[" - displays this help",
	" ban [userID] - [hack]bans user from the server",
	" index [role name] [1/0] - indexes self and mod-only roles",
	" roles - lists all indexed roles (selfroleable and mod-only) for the server"],
	execute: (msg,args)=>{
		commands.help.execute(msg,["admin"])
	},
	module: "admin",
	subcommands: {},
	guildOnly: true
}

commands.admin.subcommands.aliases = []

commands.aliases.push({base:"admin",alias:"ad"});
commands.aliases.push({base:"admin",alias:"*"});

commands.admin.subcommands.ban = {
	help: ()=> "[Hack]bans members.",
	usage: ()=> [" [userID] - Bans member with that ID."],
	execute: async (msg,args)=>{
		var membs = args.join(" ").split(/,*\s+|\n+/);
		var succ = [];
		async function banMembers (){
			return await Promise.all(membs.map(async (m) => {
				console.log(succ);
				await bot.getRESTUser(m).then(async (u)=>{
					await msg.guild.getBans().then(b=>{
						console.log(b);
						if(b){
							if(b.filter(x => x.user.id == m).length > 0){
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

commands.admin.subcommands.prune = {
	help: ()=> "Prunes messages in a channel.",
	usage: ()=> [" <number> - deletes [number] messages from the current channel, or 100 messages if not specified"],
	execute: async (msg,args)=>{
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
	guildOnly: true
}

commands.admin.subcommands.aliases.push({base:"prune",alias:"delete"});

commands.admin.subcommands.prune.subcommands.safe = {
	help: ()=> "Prunes messages in a channel, unless pinned.",
	usage: ()=> [" <number> - deletes [num] messages, or 100 if not specified"],
	execute: async (msg,args)=>{
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

commands.admin.subcommands.roles = {
	help: ()=> "List all indexed roles for a server.",
	usage: ()=> [" - lists all indexed roles for the server"],
	execute: (msg,args)=> {
		db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
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
			db.query("BEGIN TRANSACTION");
			rows.forEach(r =>{
				if(!msg.guild.roles.find(rl => rl.id == r.id)){
					db.query(`DELETE FROM roles WHERE id='${r.id}'`);
				}
			})
			db.query("COMMIT");
		})
	},
	permissions: ["manageRoles"],
	guildOnly: true
}

commands.admin.subcommands.role = {
	help: ()=> "Create, delete, edit, add, and remove roles.",
	usage: ()=> [" - shows this help",
				" create [role name] - creates new role",
				" delete [role name] - deletes existing role",
				" edit [role name] [color/name/etc] [new value] - edits existing role",
				" add [comma, separated, role names] [@memberping] - adds roles to specified member",
				" remove [comma, separated, role names] [@memberping] - removes roles from specified member"],
	execute: (msg, args) =>{
		commands.help.execute(msg,["admin","role"])
	},
	subcommands: {}
}

var adroles = commands.admin.subcommands.role;

adroles.subcommands.add = {
	help: ()=> "Add roles to mentioned users.",
	usage: ()=>[" [roles, to, add] [@user,@mentions] - adds roles to these users"],
	execute: async (msg,args)=>{
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
							db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase()).id}'`,async (err,rows)=>{
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

adroles.subcommands.remove = {
	help: ()=> "Remove roles from mentioned users.",
	usage: ()=> [" [roles, to, remove] [@user @mention] - removes roles from users"],
	execute: async (msg,args)=> {
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
							db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${msg.guild.roles.find(rl => rl.name.toLowerCase() == r.toLowerCase()).id}'`,async (err,rows)=>{
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


commands.admin.subcommands.index = {
	help: ()=> "Index new selfroles.",
	usage: ()=> [" [role name] [1/0] - Indexes new role, either self-roleable (1) or mod-roleable (0)"],
	execute: (msg,args)=>{
		if(args.length>1){
			var role_name = args.slice(0,-1).join(" ");
			var sar = args[args.length-1];
			console.log(role_name + ": " + sar);
			if(msg.guild.roles.find(r => r.name.toLowerCase() == role_name.toLowerCase())){
				var role_id = msg.guild.roles.find(r => r.name.toLowerCase() == role_name.toLowerCase()).id;
				db.query(`SELECT * FROM roles WHERE srv_id='${msg.guild.id}' AND id='${role_id}'`,(err,rows)=>{
					if(err){
						console.log(err);
						msg.channel.createMessage("There was an error.");
					} else {
						if(rows.length>0){
							setTimeout(function(){
								switch(sar){
									case "1":
									db.query(`UPDATE roles SET sar='${"1"}' WHERE srv_id='${msg.guild.id}' AND id='${role_id}'`,(err,rows)=>{
										if(err){
											console.log(err);
											msg.channel.createMessage("There was an error.");
										} else {
											msg.channel.createMessage("Self assignable role updated.")
										}
									})
									break;
									case "0":
									db.query(`UPDATE roles SET sar='${"0"}' WHERE srv_id='${msg.guild.id}' AND id='${role_id}'`,(err,rows)=>{
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
									db.query(`INSERT INTO roles VALUES (?,?,?,?)`,[msg.guild.id,role_id,1,0],(err,rows)=>{
										if(err){
											console.log(err);
											msg.channel.createMessage("There was an error.");
										} else {
											msg.channel.createMessage("Self assignable role indexed.")
										}
									})
									break;
									case "0":
									db.query(`INSERT INTO roles VALUES (?,?,?,?)`,[msg.guild.id,role_id,0,0],(err,rows)=>{
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
		cmdHandle(commands,cmd,msg,args);

	}
})


//----------------------------------------------------------------------------------------------------//

setup();
bot.connect()
.catch(e => console.log("Trouble connecting...\n"+e))
