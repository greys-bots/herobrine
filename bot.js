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
const jimp =		require('jimp'); //also for image manipulation
const config =		require('./config.json'); //configs
const Texts =		require('./strings.json'); //json full of text for different things
const Util =		require("./utilities.js");

var cur_logs =		"";
var status = 0;

const bot = new Eris(config.token,{restMode: true});

bot.server_configs = {};

//uncommenting the line below may cause "kill einvalid" errors on some computers;
//make sure the config is set up if you're getting issues
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

	bot.db.query(`CREATE TABLE IF NOT EXISTS configs (srv_id TEXT, prefix TEXT, welcome TEXT, autoroles TEXT, disabled TEXT, opped TEXT, feedback TEXT)`,(err,rows)=>{
		if(err){
			console.log(err)
		}
	});

	bot.db.query(`SELECT * FROM configs`,async (err,rows)=>{
		if(err) return console.log(err);

		await Promise.all(rows.map( s =>{
			bot.server_configs[s.srv_id] = s;
			return new Promise((res,rej)=>{
				setTimeout(res("config loaded"),100)
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
	if(!clist[args[0].toLowerCase()] && !Object.values(clist).find(cm => cm.alias && cm.alias.includes(args[0].toLowerCase())))
		return msg.channel.createMessage("Command not found.");
	await Promise.all(args.map((c,cv)=>{
		if(clist!= "" && clist[c.toLowerCase()] || Object.values(clist).find(cm => cm.alias && cm.alias.includes(c.toLowerCase()))){
			var cname = (clist[c.toLowerCase()] ? 
				c.toLowerCase() : 
				Object.keys(clist).find(cm => clist[cm].alias && clist[cm].alias.includes(c.toLowerCase())));
			if(args.length-1 == cv){
				command = clist[cname];
				cmdname = cname;
				args = [];

			} else if(clist[cname].subcommands){
				parents.push({name:cname, cmd:clist[cname]});
				clist = clist[cname].subcommands;
				lastindex = cv;

			} else if(args.length-1 != cv) {
				command = clist[cname];
				cmdname = cname;
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
		if(command.guilOnly && !msg.guild) return msg.channel.createMessage("This command can only be used in guilds.");
		if(parents[parents.length-1].permissions!=undefined){ //check perms
			await Promise.all(parents[parents.length-1].permissions.map(p=>{
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
				parents[parents.length-1].cmd.execute(bot,msg,args);
			}).catch(()=>{
				msg.channel.createMessage("You do not have permission to use that command.");
			})
		} else {
			parents[parents.length-1].cmd.execute(bot,msg,args);
		}
		
	} else {
		if(command.guilOnly && !msg.guild) return msg.channel.createMessage("This command can only be used in guilds.");
		if(command.permissions){ //check perms
			await Promise.all(command.permissions.map(p=>{
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
				command.execute(bot,msg,args);
			}).catch(()=>{
				msg.channel.createMessage("You do not have permission to use that command.");
			})
		} else {
			command.execute(bot,msg,args);
		}
		
	}
}

const updateStatus = function(){
	console.log("updating... Status code: "+status)
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
				fields:[
					{name:"**FUN**",
					value: Object.keys(bot.commands).filter(x => bot.commands[x].module == "fun" && !bot.commands[x].alias).map( c => "**"+prefix + c + "** - " + bot.commands[c].help()).sort().join("\n")},
					{name:"**UTILITY**",
					value: Object.keys(bot.commands).filter(x => bot.commands[x].module == "utility" && !bot.commands[x].alias).map( c => "**"+prefix + c + "** - " + bot.commands[c].help()).sort().join("\n")},
					{name:"**ADMIN**",
					value: Object.keys(bot.commands).filter(x => bot.commands[x].module == "admin").map( c => "**"+prefix + c + "** - " + bot.commands[c].help()).join("\n")},
				],
				color: 16755455,
				footer:{
					icon_url: bot.user.avatarURL,
					text: "Arguments like [this] are required, arguments like <this> are optional."
				}
			}
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
		if(scfg.welcome.enabled){
			bot.createMessage(scfg.welcome.channel,scfg.welcome.message);
		}
		if(scfg.autoroles != ""){
			await Promise.all(scfg.autoroles.split(",").map(r=>{
				member.addRole(r);
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
