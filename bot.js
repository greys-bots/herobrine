/*

Steve Bot Version 2.0 Official [Herobrine] (REMOTE)
Begin work date: 07 September 2017
Official "birthday": 25 September 2017

---------------------------------------------------------------------------------------------
*/

const Eris = 		require("eris-additions")(require("eris")); //da lib
const fs =			require("fs"); //file stuff
const {Client} =	require("pg"); //postgres, for data things
const dblite =		require("dblite").withSQLite('3.8.6+'); //dblite, also for data things
const pimg =		require("pngjs-image"); //for image manipulation
const jimp =		require("jimp"); //also for image manipulation
const exec =		require("child_process").exec; //self-updating code! woo!
const config =		require('./config.json'); //configs
const Texts =		require('./strings.json'); //json full of text for different things
const Util =		require("./utilities.js");

var cur_logs =		"";
var status = 0;

const bot = new Eris(config.token,{restMode: true});

bot.server_configs = {};

bot.modules = {};

bot.paused = false;

//uncommenting the line below may fix "kill einvalid" errors on some computers;
//make sure the config is set up and then uncomment if you're getting issues
// dblite.bin = config.sqlite;

try{
	bot.db = dblite("./data.sqlite","-header");
} catch(e){
	console.log(
		["Error opening database with dblite.",
		"You may need to set sqlite's location in config",
		"and uncomment the dblite.bin line in bot.js (line 32).",
		"This can be fixed by adding sqlite3.exe to your path,",
		"iff applicable."
		].join("\n") + "\nError:\n"+e);
	process.exit(1);
}


/***********************************
SETUP
***********************************/

const setup = async function(){
	if(config.update && config.remote && config.branch){
		var git = exec(`git pull ${config.remote} ${config.branch}`,{cwd: __dirname}, (err, out, stderr)=>{
			if(err){
				console.error(err);
				console.log(config.accepted_ids);
				bot.users.find(u => u.id == config.accepted_ids[0]).getDMChannel().then((ch)=>{
					ch.sendMessage("Error pulling files.")
				})
				return;
			}
			console.log(out);
			if(out.toString().includes("up to date")){
				return console.log("Everything up to date.");
			}

			var gp = exec(`git fetch --all && git reset --hard ${config.remote}/${config.branch}`, {cwd: __dirname}, (err2, out2, stderr2)=>{
				if(err2){
					console.error(err2);
					bot.users.find(u => u.id == config.accepted_ids[0]).getDMChannel().then((ch)=>{
						ch.sendMessage("Error overwriting files.")
					})
					return;
				}
				console.log("fetched and updated. output: "+out2)
			})
		})
	}

	bot.db.query(".databases");
	bot.db.query(`CREATE TABLE IF NOT EXISTS triggers (user_id TEXT, code TEXT, list TEXT, alias TEXT)`,(err,rows)=>{
		if(err){
			console.log("There was an error creating the triggers table.")
		}
	});
	bot.db.query(`CREATE TABLE IF NOT EXISTS roles (srv_id TEXT, id TEXT, sar TEXT, bundle TEXT)`,(err,rows)=>{
		if(err){
			console.log("There was an error creating the roles table.")
		}
	});

	bot.db.query(`CREATE TABLE IF NOT EXISTS configs (srv_id TEXT, prefix TEXT, welcome TEXT, autoroles TEXT, disabled TEXT, opped TEXT, feedback TEXT, logged TEXT)`,(err,rows)=>{
		if(err){
			console.log(err)
		}
	});

	bot.db.query(`SELECT * FROM configs`,async (err,rows)=>{
		if(err) return console.log(err);

		await Promise.all(rows.map( s =>{
			bot.server_configs[s.srv_id] = s;
			return new Promise((res,rej)=>{
				setTimeout(res("config for "+s.srv_id+" loaded"),100)
			})
		}))
	});

	bot.db.query(`CREATE TABLE IF NOT EXISTS profiles (usr_id TEXT, info TEXT, badges TEXT, lvl TEXT, exp TEXT, cash TEXT, daily TEXT, disabled TEXT)`,(err,rows)=>{
		if(err) {
			console.log("There was an error creating the profiles table");
		}
	});

	var files = fs.readdirSync("./commands");
	await Promise.all(files.map(f => {
		bot.commands[f.slice(0,-3)] = require("./commands/"+f);
		return new Promise((res,rej)=>{
			setTimeout(res("a"),100)
		})
	})).then(()=> console.log("finished loading commands."));
}

const cmdHandle = async function(bot, msg, args){
	var clist = bot.commands;
	var cmdname, command, lastindex;
	var parents = [];
	if(bot.paused && args[0] != "unpause") return;
	msg.channel.createMessage(bot.paused && args[0] != "unpause");
	if(!clist[args[0].toLowerCase()] && !Object.values(clist).find(cm => cm.alias && cm.alias.includes(args[0].toLowerCase())))
		return msg.channel.createMessage("Command not found.");
	await Promise.all(args.map((c,cv)=>{
		if(clist!= "" && clist[c.toLowerCase()] || Object.values(clist).find(cm => cm.alias && cm.alias.includes(c.toLowerCase()))){
			var cname = (clist[c.toLowerCase()] ? 
				c.toLowerCase() : 
				Object.keys(clist).find(cm => clist[cm].alias && clist[cm].alias.includes(c.toLowerCase())));
			if(args.length-1 == cv){
				command = {name: cname, cmd: clist[cname]};
				args = [];

			} else if(clist[cname].subcommands){
				console.log(cname);
				parents.push({name:cname, cmd:clist[cname]});
				clist = clist[cname].subcommands;
				lastindex = cv;

			} else if(args.length-1 != cv) {
				command = {name: cname, cmd: clist[cname]};
				lastindex = cv;
				clist = "";

			}
		} else {
			if(command==undefined)
			command = "notfound";
		}
		return new Promise((res,rej)=>{
			setTimeout(res("beep"),100);
		})
	}))
	if(lastindex != undefined) args = args.slice(-(args.length-(lastindex+1)));
	if((command=="notfound" || command==undefined) && !parents[0]){
		msg.channel.createMessage("Command not found.");
	} else if(parents[0] && (command == "notfound" || command == undefined)){
		if(parents[parents.length-1].cmd.guildOnly && !msg.guild) return msg.channel.createMessage("This command can only be used in guilds.");
		if(!Util.checkDisabled(bot, msg.guild.id, [parents[parents.length-1]])){ //check perms & disable status
			Util.checkPermissions(bot, msg, parents[parents.length-1]).then(()=>{
				parents[parents.length-1].cmd.execute(bot, msg, args)
			}).catch(e=>{
				console.log(e);
				msg.channel.createMessage("You dont have permission to use that command.")
			})
		} else {
			msg.channel.createMessage("That command is disabled.");
		}
		
	} else if(parents[0]){
		console.log("command with parent");
		if(command.guildOnly && !msg.guild) return msg.channel.createMessage("This command can only be used in guilds.");
		if(!Util.checkDisabled(bot, msg.guild.id, [parents[0],command])){ //check perms & disable status
			Util.checkPermissions(bot, msg, command).then(()=>{
				command.cmd.execute(bot, msg, args)
			}).catch(e=>{
				console.log(e);
				msg.channel.createMessage("You dont have permission to use that command.")
			})
		} else {
			msg.channel.createMessage("That command is disabled.");
		}	
	} else {
		console.log("base command");
		if(command.guildOnly && !msg.guild) return msg.channel.createMessage("This command can only be used in guilds.");
		if(!Util.checkDisabled(bot, msg.guild.id, [command])){ //check perms & disable status
			Util.checkPermissions(bot, msg, command).then(()=>{
				command.cmd.execute(bot, msg, args)
			}).catch(e=>{
				console.log(e);
				msg.channel.createMessage("You dont have permission to use that command.")
			})
		} else {
			msg.channel.createMessage("That command is disabled.");
		}	
	}
}

const updateStatus = function(){
	switch(status){
		case 0:
			bot.editStatus({name: "hh!help -- in "+bot.guilds.size+" guilds."});
			status++;
			break;
		case 1:
			bot.editStatus({name: "hh!help -- serving "+bot.users.size+" users."});
			status--;
			break;
	}

	setTimeout(()=> updateStatus(),600000)
}

/***********************************
MODULES
***********************************/

bot.modules.admin = {
	help: ()=> "Commands for server admins. Most require specific permissions to use.",
	color: "55aa77"
}

bot.modules.fun = {
	help: ()=> "Fun stuff! Affirming, silly, and/or random XD",
	color: "6677bb"
}

bot.modules.utility = {
	help: ()=> "Util commands that aren't necessarily mod-based.",
	color: "cc5555"
}

/***********************************
COMMANDS
***********************************/

bot.commands = {};

bot.commands.help = {
	help: () => "Use this to list commands or get help with a specific command",
	usage: () => [" - List commands and basic help functions."," [command] - Get help with that command"],
	execute: async (bot, msg, args)=>{
		console.log(args);
		var clist = bot.commands;
		var cmdname;
		var command;
		var parents = [];
		var embed;
		var prefix = (msg.guild && bot.server_configs[msg.guild.id] && bot.server_configs[msg.guild.id].prefix ? bot.server_configs[msg.guild.id].prefix : config.prefix[0]);
		if(args[0] && bot.modules[args[0].toLowerCase()]){
			var mod = bot.modules[args[0].toLowerCase()];
			embed = {
				title: "Herobrine - help: " + args[0].toLowerCase() + " module",
				description: mod.help() +
				"\n\n**Commands:** \n" + Object.keys(bot.commands).filter(x => bot.commands[x].module == args[0].toLowerCase()).map( c => "**"+prefix + c + "** - " + bot.commands[c].help()).join("\n") +
				(mod.desc ? "\n\n" + mod.desc() : ""),
				color: parseInt(mod.color,16) || 16755455,
				footer:{
					icon_url: bot.user.avatarURL,
					text: "I'm a bot. Beep boop!"
				}
			}
		} else {
			await Promise.all(args.map((c,cv)=>{
				if(clist[c.toLowerCase()] || Object.values(clist).find(cm => cm.alias && cm.alias.includes(c.toLowerCase()))){
					var cname = (clist[c.toLowerCase()] ? c.toLowerCase() : Object.keys(clist).find(cm => clist[cm].alias && clist[cm].alias.includes(c.toLowerCase())));
					if(args.length-1 == cv){

						command = clist[cname];
						cmdname = cname;

					} else if(clist[cname].subcommands){

						parents.push({name:cname, cmd:clist[cname]});
						clist = clist[cname].subcommands;

					} else if(args.length-1 != cv) {

						command = clist[cname];
						cmdname = cname;

					}
				} else {
					if(!command)
					command = "notfound";
				}
				return new Promise((res,rej)=>{
					setTimeout(res("beep"),100);
				})
			}))
			if((command=="notfound" || command==undefined) && !parents[0]){
				embed = {
					title: "Herobrine - Help",
					description: "I'm Herobrine! This bot is multi-purpose and intended for a wide range of functions.",
					fields:[],
					color: 16755455,
					footer:{
						icon_url: bot.user.avatarURL,
						text: "Arguments like [this] are required, arguments like <this> are optional."
					}
				}
				embed.fields = Object.keys(bot.modules).map(k => {return {name: `**${k.toUpperCase()}**`,value: Object.keys(bot.commands).filter(x => bot.commands[x].module == k).map( c => "**"+prefix + c + "** - " + bot.commands[c].help()).join("\n")}});
				embed.fields[embed.fields.length] = {name: "**UNSORTED**",value: Object.keys(bot.commands).filter(x => !bot.commands[x].module).map( c => "**"+prefix + c + "** - " + bot.commands[c].help()).join("\n") || "None"}
			} else if(parents[0] && (command == "notfound" || command == undefined)){
				command = parents[parents.length-1].cmd;
				embed = {
					title: "Herobrine - Help: "+ parents.map(p => p.name).join(" - "),
					description: command.help() + 
						"\n\n**Usage**\n" +
						command.usage().map(l => prefix + parents.map(p => p.name).join(" ") + l).join("\n") +
						(command.desc!=undefined ? "\n\n"+command.desc() : "") +
						(command.subcommands ? "\n\n**Subcommands**: "+Object.keys(command.subcommands).join(", ") : "") +
						(command.alias!=undefined ? "\n\n**Aliases:** "+command.alias.join(", ") : "") +
						(command.module!=undefined ? "\n\nThis command is part of the **" + (command.module || parents[0].module) + "** module." : "") +
						(command.guildOnly ? "\n\nThis command can only be used in guilds." : ""),
					color: 16755455,
					footer:{
						icon_url: bot.user.avatarURL,
						text: "Arguments like [this] are required, arguments like <this> are optional."
					}
				}
			} else if(parents[0] && command != "notfound"){
				embed = {
					title: "Herobrine - Help: "+ parents.map(p => p.name).join(" - ") + " - " + cmdname,
					description: command.help() + 
						"\n\n**Usage**\n" +
						command.usage().map(l => prefix + parents.map(p => p.name).join(" ") + " " + cmdname + l).join("\n") +
						(command.desc!=undefined ? "\n\n"+command.desc() : "") +
						(command.subcommands ? "\n\n**Subcommands**: "+Object.keys(command.subcommands).join(", ") : "") +
						(command.alias!=undefined ? "\n\n**Aliases:** "+command.alias.join(", ") : "") +
						(command.module!=undefined ? "\n\nThis command is part of the **" + (command.module || parents[0].module) + "** module." : "") +
						(command.guildOnly ? "\n\nThis command can only be used in guilds." : ""),
					color: 16755455,
					footer:{
						icon_url: bot.user.avatarURL,
						text: "Arguments like [this] are required, arguments like <this> are optional."
					}
				}
			} else {
				embed = {
					title: "Herobrine - Help: "+ cmdname,
					description: command.help() + 
						"\n\n**Usage**\n" +
						command.usage().map(l => prefix + cmdname + l).join("\n") +
						(command.desc!=undefined ? "\n\n"+command.desc() : "") +
						(command.subcommands ? "\n\n**Subcommands**: "+Object.keys(command.subcommands).join(", ") : "") +
						(command.alias!=undefined ? "\n\n**Aliases:** "+command.alias.join(", ") : "") +
						(command.module!=undefined ? "\n\nThis command is part of the **" + (command.module) + "** module." : "") +
						(command.guildOnly ? "\n\nThis command can only be used in guilds." : ""),
					color: 16755455,
					footer:{
						icon_url: bot.user.avatarURL,
						text: "Arguments like [this] are required, arguments like <this> are optional."
					}
				}
			}
		}

		if(embed && msg.guild && !msg.channel.permissionsOf(bot.user.id).has("sendMessages")){
			msg.author.getDMChannel().then(m => {
				m.createMessage("I don't have permission to send messages there. Here is your help: ").then(()=>{
					m.createMessage({embed})
				})
			})
		} else if(embed && msg.guild && !msg.channel.permissionsOf(bot.user.id).has("embedLinks")){
			msg.channel.createMessage(`**${embed.title}**\n\n${embed.description}\n\n${(embed.fields ? embed.fields.map(f => `${f.name}\n`+f.value).join("\n\n") : "")}*${embed.footer.text}*`);
		} else if(embed){
			msg.channel.createMessage({embed});
		}
	},
	module: "utility",
	alias: ["h"]
}

//---------------------------------------------- FUN ---------------------------------------------------
//======================================================================================================
//------------------------------------------------------------------------------------------------------

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
	updateStatus();
})

//- - - - - - - - - - MessageCreate - - - - - - - - - -
bot.on("messageCreate", async (msg)=>{
	if(msg.author.bot) return;

	if(msg.content.toLowerCase()=="hey herobrine"){
		msg.channel.createMessage("That's me!");
		return;
	}

	if(bot.paused && !(new RegExp("^"+config.prefix.join("|")).test(msg.content.toLowerCase()) && msg.content.includes("unpause"))) {
		return;
	} else if(bot.paused && !(new RegExp("^"+config.prefix.join("|"), "i").test(msg.content.toLowerCase()) && msg.content.toLowerCase().includes("unpause"))){
		bot.commands.unpause.execute(bot, msg, msg.content.replace(new RegExp("^"+config.prefix.join("|"), "i")))
		return;
	}

	//if(new RegExp("good\s").test(msg.content.toLowerCase()))

	bot.db.query(`SELECT * FROM profiles WHERE usr_id='${msg.author.id}'`,(err,rows)=>{
		if(err){
			console.log(err)
		} else {
			if(rows[0]){
				var exp = eval(rows[0].exp);
				var lve = eval(rows[0].lvl);
				if(exp+5>=(Math.pow(lve,2)+100)){
					lve=lve+1;
					if(exp-(Math.pow(lve,2)+100)>=0){
						exp=exp-(Math.pow(lve,2)+100);
					} else {
						exp=0;
					}

					if(rows[0].disabled != "1") msg.channel.createMessage(`Congratulations, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}! You are now level ${lve}!`);
				} else {
					exp=exp+5;
				}
				bot.db.query(`UPDATE profiles SET exp='${exp}', lvl='${lve}', cash='${eval(rows[0].cash)+5}' WHERE usr_id='${msg.author.id}'`);
			} else {
				bot.db.query(`INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?)`,[msg.author.id,{title:"Title Here",bio:"Beep boop!"},{},"1","5","5","0","0"],(err,rows)=>{
					if(err){
						console.log("Error creating profile: \n"+err);
					} else {
						console.log("profile created");
					}
				})
			}
		}
	})

	if(msg.guild && !bot.server_configs[msg.guild.id]){
		bot.db.query(`INSERT INTO configs VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,[msg.guild.id,"",{},"",{},"",{},[]],(err,rows)=>{
			if(err) return console.log(err);
			console.log(`Config for ${msg.guild.name} (${msg.guild.id}) created.`);
			Util.reloadConfig(bot,msg.guild.id)
		})
	}

	if(new RegExp("^"+config.prefix.join("|")).test(msg.content.toLowerCase()) || (msg.guild!=undefined && bot.server_configs[msg.guild.id] && (bot.server_configs[msg.guild.id].prefix!= undefined && bot.server_configs[msg.guild.id].prefix!="") && msg.content.toLowerCase().startsWith(bot.server_configs[msg.guild.id].prefix))){
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
		var str = `\r\nTime: ${ndt} at ${now.getHours().toString().length < 2 ? "0"+ now.getHours() : now.getHours()}${now.getMinutes()}\nMessage: ${msg.content}\nUser: ${msg.author.username}#${msg.author.discriminator}\nGuild: ${(msg.guild!=undefined ? msg.guild.name + "(" +msg.guild.id+ ")" : "DMs")}\r\n--------------------`;
		console.log(str);
		fs.appendFile(`./logs/${ndt}.log`,str,(err)=>{
			if(err) console.log(`Error while attempting to write log ${ndt}\n`+err);
		});

		let args = msg.content.replace(new RegExp("^"+config.prefix.join("|")+((msg.guild != undefined && bot.server_configs[msg.guild.id] && (bot.server_configs[msg.guild.id].prefix!=undefined && bot.server_configs[msg.guild.id].prefix!="")) ? "|"+bot.server_configs[msg.guild.id].prefix : ""),"i"), "").split(" ");
		if(args[args.length-1] == "help"){
			bot.commands.help.execute(bot, msg, args.slice(0,args.length-1));
		} else {
			cmdHandle(bot, msg, args);
		}
		
	}
})

bot.on("guildMemberAdd", async (guild, member)=>{
	if(bot.server_configs[guild.id]){
		var scfg = bot.server_configs[guild.id];
		console.log(scfg);
		scfg.welcome = (typeof scfg.welcome == "string" ? JSON.parse(scfg.welcome) : scfg.welcome);
		if(scfg.welcome.enabled && scfg.welcome.msg){
			var msg = eval("`"+scfg.welcome.msg.split(" ").map(s => { return Texts.welc_strings[s.replace(/[?,!\s]|\.\s+/,"")] + s.match(/[?,!\s]|\.\s+/) || s; }).join(" ")+"`");
			bot.createMessage(scfg.welcome.channel, msg);
		}
		if(scfg.welcome.enabled && scfg.autoroles){
			await Promise.all(scfg.autoroles.split(", ").map(r=>{
				if(guild.roles.find(rl => rl.id == r)){
					member.addRole(r);
				} else {
					guild.members.find(m => m.id == guild.ownerID).user.getDMChannel().then((c)=> c.createMessage("Autorole not found: "+r+"\nRemoving role from autoroles."));
					scfg.autoroles = scfg.autoroles.replace(", "+r,"").replace(r+", ","");
					bot.db.query(`UPDATE configs SET autoroles=? WHERE srv_id='${guild.id}'`,[scfg.autoroles]);
				}
			})).then(()=>{
				console.log(`Successfully added autoroles in guild ${guild.name} ${guild.id}`);
			}).catch(e=> console.log(e));
		}
	}
})


//----------------------------------------------------------------------------------------------------//

setup();
bot.connect()
.catch(e => console.log("Trouble connecting...\n"+e))
