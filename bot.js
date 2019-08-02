/*

Steve Bot Version 2.0 Official [Herobrine] (LOCAL)
Begin work date: 07 September 2017
Official "birthday": 25 September 2017

---------------------------------------------------------------------------------------------
*/

const Eris = 		require("eris-additions")(require("eris")); //da lib
const fs =			require("fs"); //file stuff
const {Client} =	require("pg"); //postgres, for data things
const dblite =		require("dblite").withSQLite('3.8.6+'); //dblite, also for data things
const exec =		require("child_process").exec; //self-updating code! woo!
const config = 		require ("./config.json");

var cur_logs =		"";
var status = 		0;

const bot = new Eris(config.token,{restMode: true});

bot.utils = require('./utilities');
bot.cfg = config;
bot.strings = require('./strings.json');
bot.fetch = require('node-fetch');
bot.tc = require('tinycolor2');

bot.modules = {};

bot.paused = false;

//uncommenting the line below may fix "kill einvalid" errors on some computers;
//make sure the config is set up and then uncomment if you're getting issues
// dblite.bin = bot.cfg.sqlite;

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
	if(bot.cfg.update && bot.cfg.remote && bot.cfg.branch){
		var git = exec(`git pull ${bot.cfg.remote} ${bot.cfg.branch}`,{cwd: __dirname}, (err, out, stderr)=>{
			if(err){
				console.error(err);
				console.log(bot.cfg.accepted_ids);
				bot.users.find(u => u.id == bot.cfg.accepted_ids[0]).getDMChannel().then((ch)=>{
					ch.sendMessage("Error pulling files.")
				})
				return;
			}
			console.log(out);
			if(out.toString().includes("up to date")){
				return console.log("Everything up to date.");
			}

			var gp = exec(`git fetch --all && git reset --hard ${bot.cfg.remote}/${bot.cfg.branch}`, {cwd: __dirname}, (err2, out2, stderr2)=>{
				if(err2){
					console.error(err2);
					bot.users.find(u => u.id == bot.cfg.accepted_ids[0]).getDMChannel().then((ch)=>{
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

	bot.db.query(`CREATE TABLE IF NOT EXISTS configs (srv_id TEXT, prefix TEXT, welcome TEXT, autoroles TEXT, disabled TEXT, opped TEXT, feedback TEXT, logged TEXT, autopin TEXT, aliases TEXT)`,(err,rows)=>{
		if(err){
			console.log(err)
		}
	});

	bot.db.query(`CREATE TABLE IF NOT EXISTS profiles (usr_id TEXT, info TEXT, badges TEXT, lvl TEXT, exp TEXT, cash TEXT, daily TEXT, disabled TEXT)`,(err,rows)=>{
		if(err) {
			console.log("There was an error creating the profiles table");
		}
	});

	bot.db.query(`CREATE TABLE IF NOT EXISTS bundles (srv_id TEXT, name TEXT, roles TEXT, sa TEXT)`, (err, rows)=> {
		if(err) console.log("Error creating bundles table.\n" + err);
	});

	var files = fs.readdirSync("./commands");
	await Promise.all(files.map(f => {
		bot.commands[f.slice(0,-3)] = require("./commands/"+f);
		return new Promise((res,rej)=>{
			setTimeout(res("a"),100)
		})
	})).then(()=> console.log("finished loading commands."));
}

bot.parseCommand = async function(bot, msg, args, command){
	return new Promise(async (res,rej)=>{
		var cfg = await bot.utils.getConfig(bot, msg.guild.id);
		var commands;
		var cmd;
		var name = "";
		if(command) {
			commands = command.subcommands || [];
		} else {
			commands = bot.commands;
		}

		if(args[0] && commands[args[0].toLowerCase()]) {
			cmd = commands[args[0].toLowerCase()];
			name = args[0].toLowerCase();
			args = args.slice(1);
		} else if(args[0] && Object.values(commands).find(cm => cm.alias && cm.alias.includes(args[0].toLowerCase()))) {
			cmd = Object.values(commands).find(cm => cm.alias && cm.alias.includes(args[0].toLowerCase()));
			name = Object.keys(commands).find(cm => commands[cm].alias && commands[cm].alias.includes(args[0].toLowerCase()));
			args = args.slice(1);
		} else if(cfg && cfg.aliases && cfg.aliases[0]) {
			if(cfg.aliases.find(x => x.alias == args[0].toLowerCase())) {
				let data = await bot.parseCommand(bot, msg, cfg.aliases.find(x => x.alias == args[0].toLowerCase()).cmdname.split(" ").concat(args.slice(1)));
				if(data) {
					cmd = data[0]; args = data[1];
					name += " "+data[2];
				}
			}
		}

		if(cmd && cmd.subcommands && args[0]) {
			let data = await bot.parseCommand(bot, msg, args, cmd);
			if(data) {
				cmd = data[0]; args = data[1];
				name += " "+data[2];
			}
		}

		if(!cmd) {
			if(command) {
				cmd = command;
				res([cmd, args, name]);
			} else {
				rej("Command not found.");
			}
		} else {
			res([cmd, args, name])
		}
	})
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
		let cmd;
		let names;
		let embed;
		if(args[0]) {
			var c = args[0].toLowerCase();
			if(bot.modules[c]) {
				var mod = bot.modules[c];
				embed = {
					title: "Herobrine - help: " + c + " module",
					description: mod.help() +
					"\n\n**Commands:** \n" + Object.keys(bot.commands).filter(x => bot.commands[x].module == c).map( cm => "**"+bot.cfg.prefix[0] + cm + "** - " + bot.commands[cm].help()).join("\n") +
					(mod.desc ? "\n\n" + mod.desc() : ""),
					color: parseInt(mod.color,16) || 16755455,
					footer:{
						icon_url: bot.user.avatarURL,
						text: "I'm a bot. Beep boop!"
					}
				}
			} else {
				let dat;
				try {
					dat = await bot.parseCommand(bot, msg, args);
				} catch(e) {
					console.log(e);
					return msg.channel.createMessage('Command not found.');
				}
				cmd = dat[0];
				names = dat[2].split(" ");
				embed = {
					title: `Help | ${names.join(" - ").toLowerCase()}`,
					description: [
						`${cmd.help()}\n\n`,
						`**Usage**\n${cmd.usage().map(c => `${bot.cfg.prefix[0] + names.join(" ")}${c}`).join("\n")}\n\n`,
						`**Aliases:** ${cmd.alias ? cmd.alias.join(", ") : "(none)"}\n\n`,
						`**Subcommands**\n${cmd.subcommands ?
							Object.keys(cmd.subcommands).map(sc => `**${bot.cfg.prefix[0]}${names.join(" ")} ${sc}** - ${cmd.subcommands[sc].help()}`).join("\n") : 
							"(none)"}`
					].join(""),
					footer: {
						text: "[required] <optional>"
					}
				}
			}
		} else {
			embed = {
				title: `Herobrine - Help`,
				description: "I'm Herobrine! This bot is multi-purpose and intended for a wide range of functions.",
				fields: Object.keys(bot.modules).map(m => {
					return {name: `**${m.toUpperCase()}**`,
							value: Object.keys(bot.commands).map(c => {
								return bot.commands[c].module == m ?
								`**${bot.cfg.prefix[0] + c}** - ${bot.commands[c].help()}\n` :
								""
							}).join("")}
				}),
				footer: {
					text: "[required] <optional>"
				}
			}
			embed.fields.push({name: "**UNSORTED**",value: Object.keys(bot.commands).map(c => {
								return !bot.commands[c].module ?
								`**${bot.cfg.prefix[0] + c}** - ${bot.commands[c].help()}\n` :
								""
							}).join("") })
		}

		msg.channel.createMessage({embed: embed});
	},
	module: "utility",
	alias: ["h"]
}

bot.commands.reload = {
	help: ()=> "Reloads entire bot.",
	usage: ()=> [" - reloads Herobrine"],
	execute: (bot, msg, args)=>{
		if(bot.cfg.update){
			if(bot.cfg.accepted_ids.includes(msg.author.id) && bot.cfg.branch && bot.cfg.remote){
				var git = exec(`git pull ${bot.cfg.remote} ${bot.cfg.branch}`,{cwd: __dirname}, (err, out, stderr)=>{
					if(err){
						console.error(err);
						bot.users.find(u => u.id == bot.cfg.accepted_ids[0]).getDMChannel().then((ch)=>{
							ch.sendMessage("Error pulling files.")
						})
						return;
					}
					console.log(out);
					if(out.toString().includes("up to date")){
						return console.log("Everything up to date.");
					}

					var gp = exec(`git fetch --all && git reset --hard ${bot.cfg.remote}/${bot.cfg.branch}`, {cwd: __dirname}, (err2, out2, stderr2)=>{
						if(err2){
							console.error(err2);
							bot.users.find(u => u.id == bot.cfg.accepted_ids[0]).getDMChannel().then((ch)=>{
								ch.sendMessage("Error overwriting files.")
							})
							return;
						}
						console.log("fetched and updated. output: "+out2)
					})
				})
			} else {
				msg.channel.createMessage("Only the bot creator can do that.")
			}
		} else {
			msg.channel.createMessage("Updates are disabled. Turn them on and supply a remote and branch in order to use this command.")
		}
	}
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

	var cfg = await bot.utils.getConfig(bot, msg.guild.id)

	var prefix = (msg.guild && 
				  cfg && 
				  (cfg.prefix!= undefined && 
				  cfg.prefix!="")) ? 
				  new RegExp(`^(?:${cfg.prefix}|<@!?${bot.user.id}>)`, "i") :
				  new RegExp(`^(${bot.cfg.prefix.join("|")}|<@!?${bot.user.id}>)`, "i");

	if(bot.paused && !prefix.test(msg.content.toLowerCase())) {
		return;
	} else if(bot.paused && (new RegExp(`^(${bot.cfg.prefix.join("|")})unpause`, "i").test(msg.content.toLowerCase()) && bot.cfg.accepted_ids.includes(msg.author.id))){
		bot.commands.unpause.execute(bot, msg, msg.content.replace(prefix, ""));
		return;
	}

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

					if(rows[0].disabled != "1" && !(cfg.disabled && cfg.disabled.levels)) msg.channel.createMessage(`Congratulations, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}! You are now level ${lve}!`);
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

	if(msg.guild && !cfg){
		bot.db.query(`INSERT INTO configs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[msg.guild.id,"",{},"",{},"",{},[],[],[]],(err,rows)=>{
			if(err) return console.log(err);
			console.log(`Config for ${msg.guild.name} (${msg.guild.id}) created.`);
		})
	}

	if(prefix.test(msg.content.toLowerCase())){
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

		let args = msg.content.replace(prefix, "").split(" ");
		if(!args[0]) args.shift();
		if(!args[0]) return msg.channel.createMessage("That's me!");
		if(args[args.length-1] == "help"){
			bot.commands.help.execute(bot, msg, args.slice(0,args.length-1));
		} else {
			await bot.parseCommand(bot, msg, args).then(async dat =>{
				var cmd = dat[0];
				var check;
				if(cmd.guildOnly && !msg.guild) {
					return msg.channel.createMessage("This command can only be used in guilds.");
				}
				check = await bot.utils.checkPermissions(bot, msg, cmd);
				if(!check && !bot.cfg.accepted_ids.includes(msg.author.id)) {
					return msg.channel.createMessage("You do not have permission to use this command.");
				}
				check = await bot.utils.isDisabled(bot, msg.guild.id, cmd, dat[2]);
				if(check && !(dat[2] == "enable" || dat[2] == "disable")) {
					return msg.channel.createMessage("That command is disabled.");
				}
				cmd.execute(bot, msg, dat[1]);
			}).catch(e =>{
				msg.channel.createMessage("Error: "+ e);
			});
		}
		
	}
})

bot.on("guildMemberAdd", async (guild, member)=>{
	if(member.user.bot) return;
	var cfg = await bot.utils.getConfig(bot, guild.id);
	if(cfg){
		if(cfg.welcome.enabled && cfg.welcome.msg){
			var msg = cfg.welcome.msg;
			await Promise.all(Object.keys(bot.strings.welc_strings).map(s => {
				msg = msg.replace(s,eval("`"+bot.strings.welc_strings[s]+"`"),"g");
				console.log(msg);
				return new Promise(res=> setTimeout(()=>res(1),100))
			})).then(()=>{
				bot.createMessage(cfg.welcome.channel, msg);
			})
		}
		if(cfg.welcome.enabled && cfg.autoroles){
			await Promise.all(cfg.autoroles.split(", ").map(r=>{
				if(guild.roles.find(rl => rl.id == r)){
					member.addRole(r);
				} else {
					guild.members.find(m => m.id == guild.ownerID).user.getDMChannel().then((c)=> c.createMessage("Autorole not found: "+r+"\nRemoving role from autoroles."));
					cfg.autoroles = cfg.autoroles.replace(", "+r,"").replace(r+", ","");
					bot.db.query(`UPDATE configs SET autoroles=? WHERE srv_id='${guild.id}'`,[cfg.autoroles]);
				}
			})).then(()=>{
				console.log(`Successfully added autoroles in guild ${guild.name} ${guild.id}`);
			}).catch(e=> console.log(e));
		}
	}
})

bot.on("messageReactionAdd",async (msg, emoji, user) => {
	var cfg = await bot.utils.getConfig(bot, msg.channel.guild.id);
	if(cfg && cfg.autopin) {
		var cf = cfg.autopin.find(c => c.emoji == emoji.name || c.emoji == `:${emoji.name}:${emoji.id}`);
		if(cf) {
			var chan = cf.channel;
			var member = msg.channel.guild.members.find(m => m.id == user);
			if(member.permission.has("manageMessages")) {
				var message = await msg.channel.getMessage(msg.id);
				var attach = [];
				if(message.attachments[0]) {
					await Promise.all(message.attachments.map(async (f,i) => {
						var att = await bot.fetch(f.url);
						attach.push({file: Buffer.from(await att.buffer()), name: f.filename});
						return new Promise(res => {
							setTimeout(()=> res(1), 100);
						})
					}))
				}
				var embed = {
					author: {
						name: `${message.author.username}#${message.author.discriminator}`,
						icon_url: message.author.avatarURL
					},
					footer: {
						text: message.channel.name
					},
					description: (message.content || "*(image only)*") + `\n\n[Go to message](https://discordapp.com/channels/${message.channel.guild.id}/${message.channel.id}/${message.id})`,
					timestamp: new Date(message.timestamp)
				}

				bot.createMessage(chan, {embed: embed}, attach ? attach : null)
			}
		}
	}

	if(bot.posts){
		if(bot.user.id == user) return;
		if(bot.posts && bot.posts[msg.id] && bot.posts[msg.id].user == user) {
			switch(emoji.name) {
				case '\u2705':
					var role;
					var color = bot.posts[msg.id].data.toHex() == "000000" ? "000001" : bot.posts[msg.id].data.toHex();
					role = msg.channel.guild.roles.find(r => r.name == user);
					if(!role) role = await bot.createRole(msg.channel.guild.id, {name: user, color: parseInt(color,16)});
					else role = await bot.editRole(msg.channel.guild.id, role.id, {color: parseInt(color, 16)});
					await bot.addGuildMemberRole(msg.channel.guild.id, user, role.id);
					await bot.editMessage(msg.channel.id, msg.id, {content: "Color successfully changed to #"+color+".", embed: {}});
					await bot.removeMessageReactions(msg.channel.id, msg.id);
					delete bot.posts[msg.id];
					break;
				case '\u274C':
					bot.editMessage(msg.channel.id, msg.id, {content: "Action cancelled.", embed: {}});
					bot.removeMessageReactions(msg.channel.id, msg.id);
					delete bot.posts[msg.id];
					break
				case '🔀':
					var color = bot.tc(Math.floor(Math.random()*16777215).toString(16));
					bot.editMessage(msg.channel.id, msg.id, {embed: {
						title: "Color "+color.toHexString().toUpperCase(),
						image: {
							url: `https://sheep.greysdawn.tk/color/${color.toHex()}`
						},
						color: parseInt(color.toHex(), 16)
					}})
					clearTimeout(bot.posts[msg.id].timeout)
					bot.posts[msg.id] = {
						user: bot.posts[msg.id].user,
						data: color,
						timeout: setTimeout(()=> {
							if(!bot.posts[msg.id]) return;
							message.removeReactions()
							delete bot.posts[message.id];
						}, 900000)
					};
					break;
			}
		}
	}

	if(bot.pages && bot.pages[msg.id] && bot.pages[msg.id].user == user) {
		if(emoji.name == "\u2b05") {
			if(bot.pages[msg.id].index == 0) {
				bot.pages[msg.id].index = bot.pages[msg.id].data.length-1;
			} else {
				bot.pages[msg.id].index -= 1;
			}
			bot.editMessage(msg.channel.id, msg.id, bot.pages[msg.id].data[bot.pages[msg.id].index]);
		} else if(emoji.name == "\u27a1") {
			if(bot.pages[msg.id].index == bot.pages[msg.id].data.length-1) {
				bot.pages[msg.id].index = 0;
			} else {
				bot.pages[msg.id].index += 1;
			}
			bot.editMessage(msg.channel.id, msg.id, bot.pages[msg.id].data[bot.pages[msg.id].index]);
		} else if(emoji.name == "\u23f9") {
			bot.deleteMessage(msg.channel.id, msg.id);
			delete bot.pages[msg.id];
		}
	}
})


//----------------------------------------------------------------------------------------------------//

setup();
bot.connect()
.catch(e => console.log("Trouble connecting...\n"+e))
