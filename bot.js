/*

Steve Bot Version 2.0 Official [Herobrine] (LOCAL)
Begin work date: 07 September 2017
Official "birthday": 25 September 2017

---------------------------------------------------------------------------------------------
*/

const Eris = 		require("eris-additions")(require("eris")); //da lib
const {Client} =	require("pg"); //postgres, for data things
const dblite =		require("dblite").withSQLite('3.8.6+'); //dblite, also for data things
const exec =		require("child_process").exec; //self-updating code! woo!
const config = 		require ("./config.json");

var status = 		0;

const bot = new Eris(config.token,{restMode: true});

bot.utils = require('./utilities');
bot.cfg = config;
bot.strings = require('./strings.json');
bot.fetch = require('node-fetch');
bot.duri = require('datauri');
bot.tc = require('tinycolor2');
bot.fs = require('fs');

bot.modules = {};

bot.paused = false;

bot.cur_logs = "";

bot.customActions = [
	{name: "member.hr", replace: "msg.member.hasRole"},
	{name: "member.rr", replace: "await msg.member.removeRole"},
	{name: "member.ar", replace: "await msg.member.addRole"},
	{name: "member.bl", replace: "await bot.commands.blacklist.execute(bot, msg, [msg.member.id])"},
	{name: "args.hr", replace: (arg) => "msg.guild.members.find(m => m.id == "+arg+").hasRole"},
	{name: "args.rr", replace: (arg) => "await msg.guild.members.find(m => m.id == "+arg+").removeRole"},
	{name: "args.ar", replace: (arg) => "await msg.guild.members.find(m => m.id == "+arg+").addRole"},
	{name: "args.bl", replace: (arg) => "await bot.commands.blacklist.subcommands.add.execute(bot, msg, [msg.guild.members.find(m => m.id == "+arg+").id])"},
	{name: "rf\\(('.*')\\)", replace: "msg.guild.roles.find(r => r.name.toLowerCase() == $1.toLowerCase()).id", regex: true}
]

bot.customActionTypes = [
	{name: "rr", description: "Remove a role"},
	{name: "hr", description: "Check if member has a role"},
	{name: "ar", description: "Add a role"},
	{name: "bl", description: "Blacklist the user from using the bot"}
]

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
		"if applicable."
		].join("\n") + "\nError:\n"+e);
	process.exit(1);
}

bot.AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

/***********************************
SETUP
***********************************/

const setup = async () => {
	if(bot.cfg.update && bot.cfg.remote && bot.cfg.branch){
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
	}

	bot.db.query(".databases");
	bot.db.query(`CREATE TABLE IF NOT EXISTS triggers (
			user_id TEXT,
			code TEXT,
			list TEXT,
			alias TEXT
		)`,(err,rows)=>{
		if(err){
			console.log("There was an error creating the triggers table.")
		}
	});
	bot.db.query(`CREATE TABLE IF NOT EXISTS roles (
			srv_id TEXT,
			id TEXT,
			sar TEXT
		)`,(err,rows)=>{
		if(err){
			console.log("There was an error creating the roles table.")
		}
	});

	//{srv_id: "", prefix: "", welcome: {}, autoroles: "", disabled: {}, opped: "", feedback: {}, logged: [], autopin: {}, aliases: []}
	bot.db.query(`CREATE TABLE IF NOT EXISTS configs (
			srv_id TEXT,
			prefix TEXT,
			welcome TEXT,
			autoroles TEXT,
			disabled TEXT,
			opped TEXT,
			feedback TEXT,
			logged TEXT,
			autopin TEXT,
			aliases TEXT
		)`,(err,rows)=>{
		if(err){
			console.log(err)
		}
	});

	bot.db.query(`CREATE TABLE IF NOT EXISTS profiles (
			usr_id TEXT,
			info TEXT,
			badges TEXT,
			lvl TEXT,
			exp TEXT,
			cash TEXT,
			daily TEXT,
			disabled INTEGER
		)`,(err,rows)=>{
		if(err) {
			console.log("There was an error creating the profiles table");
		}
	});

	bot.db.query(`CREATE TABLE IF NOT EXISTS bundles (
			srv_id TEXT,
			name TEXT,
			roles TEXT,
			sa TEXT
		)`, (err, rows)=> {
		if(err) console.log("Error creating bundles table.\n" + err);
	});

	bot.db.query(`CREATE TABLE IF NOT EXISTS starboard (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	BIGINT,
		channel_id	BIGINT,
		message_id 	BIGINT,
		original_id BIGINT,
		emoji 		TEXT
	)`) //emoji is to keep track of posts from multiple boards

	bot.db.query(`CREATE TABLE IF NOT EXISTS reactroles (
    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
    	server_id		BIGINT,
    	role_id 		BIGINT,
    	emoji 			TEXT,
    	description 	TEXT
    )`);

    bot.db.query(`CREATE TABLE IF NOT EXISTS reactcategories (
    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
    	hid 			TEXT,
    	server_id		BIGINT,
    	name 			TEXT,
    	description 	TEXT,
    	roles 			TEXT,
    	posts 			TEXT
    )`);

    bot.db.query(`CREATE TABLE IF NOT EXISTS reactposts (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		channel_id	TEXT,
		message_id	TEXT,
		roles		TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS responses (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		name 		TEXT,
		value 		TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS feedback (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid			TEXT,
		server_id	TEXT,
		sender_id 	TEXT,
		message 	TEXT,
		anon 		INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS strikes (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		server_id 	TEXT,
		user_id 	TEXT,
		reason 	TEXT
	)`)

	bot.db.query(`CREATE TABLE IF NOT EXISTS commands (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	BIGINT,
		name 		TEXT,
		actions 	TEXT,
		target 		TEXT,
		del 		INTEGER
	)`)

	bot.db.query(`CREATE TABLE IF NOT EXISTS polls (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		server_id 	TEXT,
		channel_id  TEXT,
		message_id  TEXT,
		user_id 	TEXT,
		title 		TEXT,
		description	TEXT,
		choices 	TEXT,
		active 		INTEGER,
		start 		TEXT,
		end 		TEXT
	)`)

	bot.db.query(`CREATE TABLE IF NOT EXISTS notes (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		user_id 	TEXT,
		title 		TEXT,
		body 		TEXT
	)`)

	var files = bot.fs.readdirSync("./commands");
	await Promise.all(files.map(f => {
		bot.commands[f.slice(0,-3)] = require("./commands/"+f);
		return new Promise((res,rej)=>{
			setTimeout(res("a"),100)
		})
	})).then(()=> console.log("finished loading commands."));
}

const writeLog = (bot, type, msg) => {
	let now = new Date();
	let ndt = `${(now.getMonth() + 1).toString().length < 2 ? "0"+ (now.getMonth() + 1) : now.getMonth()+1}.${now.getDate().toString().length < 2 ? "0"+ now.getDate() : now.getDate()}.${now.getFullYear()}`;
	if(!bot.fs.existsSync(`./logs/${ndt}.log`)){
		bot.fs.writeFileSync(`./logs/${ndt}.log`,"===== LOG START =====",(err)=>{
			console.log(`Error while attempting to write log ${ndt}\n${err.stack}`);
		});
	}

	bot.cur_logs = ndt;

	try {
		switch(type) {
			case "msg":
				var str = `\r\nTime: ${ndt} at ${now.getHours().toString().length < 2 ? "0"+ now.getHours() : now.getHours()}${now.getMinutes()}\nMessage: ${msg.content}\nUser: ${msg.author.username}#${msg.author.discriminator}\nGuild: ${(msg.guild!=undefined ? msg.guild.name + "(" +msg.guild.id+ ")" : "DMs")}\r\n--------------------`;
				console.log(str);
				bot.fs.appendFileSync(`./logs/${ndt}.log`,str);
				break;
			case "startup":
				bot.fs.appendFileSync(`./logs/${ndt}.log`,"\n=== BOT READY ===");
				break;
			default:
				console.log("Invalid log type");
				bot.fs.appendFileSync(`./logs/${ndt}.log`,"Invalid log type");
				break;
		}
	} catch(e) {
		console.log(`Error while attempting to write log ${ndt}\n${e.stack}`)	
	}
}

bot.formatTime = (date) => {
	if(typeof date == "string") date = new Date(date);

	return `${(date.getMonth()+1) < 10 ? "0"+(date.getMonth()+1) : (date.getMonth()+1)}.${(date.getDate()) < 10 ? "0"+(date.getDate()) : (date.getDate())}.${date.getFullYear()} at ${date.getHours() < 10 ? "0"+date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes()}`
}

bot.parseCommand = async (bot, msg, args, command) =>{
	return new Promise(async (res,rej)=>{
		var cfg = msg.guild ? await bot.utils.getConfig(bot, msg.guild.id) : undefined;
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
				res(undefined);
			}
		} else {
			res([cmd, args, name])
		}
	})
}

bot.parseCustomCommand = async function(bot, msg, args) {
	return new Promise(async res => {
		if(!args || !args[0]) return res(undefined);
		if(!msg.guild) return res(undefined);
		var name = args.shift();
		var cmd = await bot.utils.getCustomCommand(bot, msg.guild.id, name);
		if(!cmd) return res(undefined);

		cmd.newActions = [];

		cmd.actions.forEach(action => {
			if(cmd.target == "member") {
				switch(action.type) {
					case "if":
						var condition = action.condition;
						var ac = action.action;
						bot.customActions.forEach(ca => {
							var n = ca.regex ? new RegExp(ca.name) : ca.name;
							condition = condition.replace(n, ca.replace)
							ac = ac.replace(n, ca.replace);
						})
						cmd.newActions.push([new bot.AsyncFunction("bot", "msg", "args",
							`if(${condition}) ${ac};`
						), action.success, action.fail]);
						break;
					case "if:else":
						var condition = action.condition;
						var tr = action.action[0];
						var fls = action.action[1];
						bot.customActions.forEach(ca => {
							var n = ca.regex ? new RegExp(ca.name) : ca.name;
							condition = condition.replace(n, ca.replace)
							tr = tr.replace(n, ca.replace);
							fls = fls.replace(n, ca.replace);
						})

						cmd.newActions.push([new bot.AsyncFunction("bot", "msg", "args",
							`if(${condition}) ${tr};
							 else ${fls}`
						), action.success, action.fail]);
						break;
					case "rr":
						var ac = action.action;
						bot.customActions.forEach(ca => {
							var n = ca.regex ? new RegExp(ca.name) : ca.name;
							ac = ac.replace(n, ca.replace);
						})
						cmd.newActions.push([new bot.AsyncFunction("bot", "msg", "args",
							`${ac}`
						), action.success, action.fail]);
						break;
					case "ar":
						var ac = action.action;
						bot.customActions.forEach(ca => {
							var n = ca.regex ? new RegExp(ca.name) : ca.name;
							ac = ac.replace(n, ca.replace);
						})
						cmd.newActions.push([new bot.AsyncFunction("bot", "msg", "args",
							`${ac}`
						), action.success, action.fail]);
						break;
					case "bl":
						var ac = action.action;
						bot.customActions.forEach(ca => {
							var n = ca.regex ? new RegExp(ca.name) : ca.name;
							ac = ac.replace(n, ca.replace);
						})
						cmd.newActions.push([new bot.AsyncFunction("bot", "msg", "args",
							`${ac}`
						), action.success, action.fail]);
						break;
				}
			} else {
				switch(action.type) {
					case "if":
						var condition = action.condition;
						var ac = action.action;
						bot.customActions.forEach(ca => {
							var n = ca.regex ? new RegExp(ca.name) : ca.name;
							condition = condition.replace(n, ca.replace)
							ac = ac.replace(n, ca.replace);
						})
						cmd.newActions.push([new bot.AsyncFunction("bot", "msg", "args",
							`if(${condition}) ${ac};`
						), action.success, action.fail]);
						break;
					case "if:else":
						var condition = action.condition;
						var tr = action.action[0];
						var fls = action.action[1];
						bot.customActions.forEach(ca => {
							var n = ca.regex ? new RegExp(ca.name) : ca.name;
							condition = condition.replace(n, ca.replace)
							tr = tr.replace(n, ca.replace);
							fls = fls.replace(n, ca.replace);
						})

						cmd.newActions.push([new bot.AsyncFunction("bot", "msg", "args",
							`if(${condition}) ${tr};
							 else ${fls}`
						), action.success, action.fail]);
						break;
					case "rr":
						args.forEach(arg => {
							var ac = action.action;
							bot.customActions.forEach(ca => {
								var n = ca.regex ? new RegExp(ca.name) : ca.name;
								ac = ac.replace(n, typeof ca.replace == "function" ? ca.replace(arg) : ca.replace);
							})
							cmd.newActions.push([new bot.AsyncFunction("bot", "msg", "args",
								`${ac}`
							), action.success, action.fail]);
						})
						break;
					case "ar":
						args.forEach(arg => {
							var ac = action.action;
							bot.customActions.forEach(ca => {
								var n = ca.regex ? new RegExp(ca.name) : ca.name;
								ac = ac.replace(n, typeof ca.replace == "function" ? ca.replace(arg) : ca.replace);
							})
							cmd.newActions.push([new bot.AsyncFunction("bot", "msg", "args",
								`${ac}`
							), action.success, action.fail]);
						})
						break;
					case "bl":
						args.forEach(arg => {
							var ac = action.action;
							bot.customActions.forEach(ca => {
								var n = ca.regex ? new RegExp(ca.name) : ca.name;
								ac = ac.replace(n, typeof ca.replace == "function" ? ca.replace(arg) : ca.replace);
							})
							cmd.newActions.push([new bot.AsyncFunction("bot", "msg", "args",
								`${ac}`
							), action.success, action.fail]);
						})
						break;
				}
			}			
		})

		cmd.execute = async (bot, msg, args, cmd) => {
			console.log("executing...");
			let msgs = [];
			await bot.asyncForEach(cmd.newActions, bot, msg, args, async (bot, msg, args, a) => {
				try {
					await a[0].call(null, bot, msg, args);
				} catch (e) {
					if(e) console.log(e);
					if(a[2]) return await msg.channel.createMessage(a[2] +`\n${e.message}`).then(message => {msgs.push(message)})
				}
				if(a[1]) await msg.channel.createMessage(a[1]).then(message => {
					msgs.push(message);
				})
			})
			if(cmd.del) {
				setTimeout(async ()=> {
					await msg.delete();
					await Promise.all(msgs.map(async m => {
						await m.delete()
						return new Promise(res => res(""))
					}))
				}, 2000)
				
			}
			
		}

		res([cmd, args, name])
	})
}

bot.asyncForEach = async (arr, bot, msg, args, cb) => {
	for (let i = 0; i < arr.length; i++) {
	    await cb(bot, msg, args, arr[i], i, arr);
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

bot.modules.utility = {
	help: ()=> "Util commands that aren't necessarily mod-based.",
	color: "cc5555"
}

bot.modules.fun = {
	help: ()=> "Fun stuff! Affirming, silly, and/or random XD",
	color: "6677bb"
}

bot.modules["owner only"] = {
	help: ()=> "Commands that aren't sorted into other categories.",
	color: "aaaaaa"
}

bot.modules.unsorted = {
	help: ()=> "Commands that aren't sorted into the other categories.",
	color: "555555"
}

/***********************************
COMMANDS
***********************************/

bot.commands = {};

//This is in here in case something goes wrong with loading commands from files
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
				dat = await bot.parseCommand(bot, msg, args);
				if(!dat) return msg.channel.createMessage("Command not found");
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
					color: dat[0].module ? parseInt(bot.modules[dat[0].module].color, 16) : parseInt("555555", 16),
					footer: {
						text: "[required] <optional>"
					}
				}

				msg.channel.createMessage({embed: embed});
			}
		} else {
			var embeds = [];
			for(var i = 0; i < Object.keys(bot.modules).length; i++) {
				var cmds = Object.keys(bot.commands).filter(c => bot.commands[c].module == Object.keys(bot.modules)[i]
										|| (Object.keys(bot.modules)[i] == "unsorted" && !bot.commands[c].module))
										.sort();
				if(cmds && cmds[0]) {
					console.log("commands found");
					var nembeds = await bot.utils.genEmbeds(bot, cmds, c => {
						return {name: `**${bot.cfg.prefix[0] + c}**`, value: bot.commands[c].help()}
					}, {
						title: `**${Object.keys(bot.modules)[i].toUpperCase()}**`,
						description: bot.modules[Object.keys(bot.modules)[i]].help(),
						color:  parseInt(bot.modules[Object.keys(bot.modules)[i]].color, 16),
						footer: {
							icon_url: bot.user.avatarURL,
							text: "I'm Herobrine! This bot is multi-purpose and intended for a wide range of functions."
						}
					}, 10, {addition: ""})
					console.log(nembeds);
					embeds = embeds.concat(nembeds);
				}
			}

			for(let i=0; i<embeds.length; i++) {
				if(embeds.length > 1) embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${Object.keys(bot.commands).length} commands total)`;
			}

			var message = await msg.channel.createMessage(embeds[0]);
			if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				data: embeds,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					message.removeReaction("\u2b05");
					message.removeReaction("\u27a1");
					message.removeReaction("\u23f9");
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			message.addReaction("\u2b05");
			message.addReaction("\u27a1");
			message.addReaction("\u23f9");
			
		}
	},
	module: "utility",
	alias: ["h"]
}

//same as above with this
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
	},
	module: "owner only"
}

//---------------------------------------------- FUN ---------------------------------------------------
//======================================================================================================
//------------------------------------------------------------------------------------------------------

bot.on("ready",()=>{
	console.log("Ready.");
	writeLog(bot, "startup");
	updateStatus();
})

//- - - - - - - - - - MessageCreate - - - - - - - - - -
bot.on("messageCreate", async (msg)=>{
	if(msg.author.bot) return;

	if(msg.content.toLowerCase()=="hey herobrine"){
		msg.channel.createMessage("That's me!");
		return;
	}

	var cfg;
	if(msg.guild) cfg = await bot.utils.getConfig(bot, msg.guild.id);
	else cfg = undefined;

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

	var lvlup = await bot.utils.handleBonus(bot, msg);
	if(lvlup.success) {
		if(lvlup.msg && !(cfg && cfg.disabled && cfg.disabled.levels)) msg.channel.createMessage(lvlup.msg);
	} else {
		console.log("Couldn't handle cash/exp");
	}

	if(msg.guild && !cfg) await bot.utils.createConfig(bot, msg.guild.id);

	if(msg.guild) {
		var tag = await bot.utils.getTag(bot, msg.guild.id, msg.content.replace(prefix, "").toLowerCase());
		if(tag) return msg.channel.createMessage(typeof tag.value == "string" ? tag.value : bot.utils.randomText(tag.value));
	}

	if(prefix.test(msg.content.toLowerCase())){

		writeLog(bot, "msg", msg);

		let args = msg.content.replace(prefix, "").split(" ");
		if(!args[0]) args.shift();
		if(!args[0]) return msg.channel.createMessage("That's me!");
		if(args[args.length-1] == "help"){
			bot.commands.help.execute(bot, msg, args.slice(0,args.length-1));
		} else {
			var cmd = await bot.parseCommand(bot, msg, args);
			if(!cmd) cmd = await bot.parseCustomCommand(bot, msg, args);
			if(cmd) {
				if(cmd[0].guildOnly && !msg.guild) {
					return msg.channel.createMessage("This command can only be used in guilds.");
				}
				if(msg.guild) {
					var check;
					check = await bot.utils.checkPermissions(bot, msg, cmd[0]);
					if(!check && !bot.cfg.accepted_ids.includes(msg.author.id)) {
						return msg.channel.createMessage("You do not have permission to use this command.");
					}
					check = await bot.utils.isDisabled(bot, msg.guild.id, cmd[0], cmd[2]);
					if(check && !(cmd[2] == "enable" || cmd[2] == "disable")) {
						return msg.channel.createMessage("That command is disabled.");
					}
				}
				cmd[0].execute(bot, msg, cmd[1], cmd[0]);
			} else {
				msg.channel.createMessage("Command not found");
			}
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
	if(bot.menus && bot.menus[msg.id] && bot.menus[msg.id].user == user) {
		try {
			await bot.menus[msg.id].execute(bot, msg, emoji);	
		} catch(e) {
			console.log(e);
			msg.channel.createMessage("ERR:\n"+e.message);
		}
		return;
	}

	if(!msg.channel.guild) return;

	var cfg;
	if(msg.channel.guild) cfg = await bot.utils.getConfig(bot, msg.channel.guild.id);
	else cfg = undefined;
	if(cfg && cfg.autopin && cfg.autopin.boards) {
		var em;
		if(emoji.id) em = `:${emoji.name}:${emoji.id}`;
		else em = emoji.name; 
		var cf = cfg.autopin.boards.find(c => c.emoji == em);
		if(cf) {
			var sbpost = await bot.utils.getStarPost(bot, msg.channel.guild.id, msg.id, em);
			var message = await bot.getMessage(msg.channel.id, msg.id);
			if(!sbpost) {
				var chan = cf.channel;
				var member = msg.channel.guild.members.find(m => m.id == user);
				var tolerance = cf.tolerance ? cf.tolerance : (cfg.autopin.tolerance || 2);
				if((member.permission.has("manageMessages") && cfg.autopin.override) || (message.reactions[em.replace(/^:/,"")].count === tolerance)) {
					bot.utils.starMessage(bot, message, chan, {emoji: em, count: message.reactions[em.replace(/^:/,"")].count})
				}
			} else {
				await bot.utils.updateStarPost(bot, msg.channel.guild.id, msg.id, {emoji: em, count: message.reactions[em.replace(/^:/,"")].count})
			}
		}
	}

	if(user == bot.user.id) return;

	var post = await bot.utils.getReactPost(bot, msg.channel.guild.id, msg.id);
	var message = await bot.getMessage(msg.channel.id, msg.id);
	if(post) {
		var role = post.roles.find(r => (emoji.id ? r.emoji == `:${emoji.name}:${emoji.id}` || r.emoji == `a:${emoji.name}:${emoji.id}` : r.emoji == emoji.name));
		if(!role) return;
		var rl = msg.channel.guild.roles.find(r => r.id == role.role_id);
		if(!rl) return;
		var member = msg.channel.guild.members.find(m => m.id == user);
		if(!member) return;
		if(member.roles.includes(rl.id)) {
			try {
				msg.channel.guild.removeMemberRole(user, rl.id);
				bot.removeMessageReaction(msg.channel.id, msg.id, emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name, user);
			} catch(e) {
				console.log(e);
				await bot.getDMChannel(user).then(ch => {
					ch.createMessage(`Couldn't give you role **${rl.name}** in ${msg.channel.guild.name}. Please let a moderator know that something went wrong`)
				})
			}
		} else {
			try {
				msg.channel.guild.addMemberRole(user, rl.id);
				bot.removeMessageReaction(msg.channel.id, msg.id, emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name, user);
			} catch(e) {
				console.log(e);
				await bot.getDMChannel(user).then(ch => {
					ch.createMessage(`Couldn't give you role **${rl.name}** in ${msg.channel.guild.name}. Please let a moderator know that something went wrong`)
				})
			}
		}
	}

	var poll = await bot.utils.getPoll(bot, msg.channel.guild.id, msg.channel.id, msg.id);
	if(poll && poll.active) {
		var embed = message.embeds[0];
		if(bot.strings.pollnumbers.includes(emoji.name)) {
			var ind = bot.strings.pollnumbers.indexOf(emoji.name)-1;
			if(poll.choices[ind]) {
				var choice = poll.choices[ind];
				if(!choice.voters) choice.voters = [];
				if(choice.voters.includes(user)) {
					choice.count -= 1;
					choice.voters = choice.voters.filter(v => v != user);
					embed.fields[ind].value = choice.count + " votes";
				} else if(poll.choices.find(c => c.voters && c.voters.includes(user))) {
					var ind2 = poll.choices.indexOf(poll.choices.find(c => c.voters && c.voters.includes(user)));
					poll.choices[ind2].voters = poll.choices[ind2].voters.filter(v => v != user);
					poll.choices[ind2].count -= 1;
					choice.count += 1;
					choice.voters.push(user);
					embed.fields[ind].value = choice.count + " votes";
					embed.fields[ind2].value = poll.choices[ind2].count + " votes";
				} else {
					choice.count += 1;
					choice.voters.push(user);
					embed.fields[ind].value = choice.count + " votes";
				}
				poll.choices[ind] = choice;
				await bot.utils.editPoll(bot, poll.server_id, poll.channel_id, poll.message_id, "choices", poll.choices);
				
				await bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
				await bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
			}
		} else {
			switch(emoji.name) {
				case "✅":
					await bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
					if(poll.user_id == user) {
						var date = new Date();
						await bot.utils.endPoll(bot, poll.server_id, poll.hid, date.toISOString());
					
						embed.title += " (ENDED)";
						embed.color = parseInt("aa5555", 16);
						embed.footer.text += " | Ended: "+bot.formatTime(date);
						embed.timestamp = date.toISOString();
						await bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
						await message.removeReactions();
					}
					break;
				case "\u270f":
					await bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
					if(poll.user_id == user) {
						var resp;
						var m2;
						m2 = await msg.channel.createMessage([
							"What would you like to edit?",
							"```",
							"1 - title",
							"2 - description",
							"3 - choices",
							"```"
						].join("\n"));
						resp = await msg.channel.awaitMessages(m => m.author.id == user, {time: 30000, maxMatches: 1});
						if(!resp || !resp[0]) {
							var errmsg = msg.channel.createMessage("ERR: timed out. Aborting");
							setTimeout(()=> errmsg.delete(), 15000);
							return;
						}

						await resp[0].delete();
						switch(resp[0].content.toLowerCase()) {
							case "1":
								await m2.edit("Enter the new title. You have a minute to do this, or you can type `cancel` to cancel");
								resp = await msg.channel.awaitMessages(m => m.author.id == user, {time: 60000, maxMatches: 1});
								if(!resp || !resp[0]) { 
									var errmsg = msg.channel.createMessage("ERR: timed out. Aborting");
									setTimeout(()=> errmsg.delete(), 15000);
									return;
								}
								if(resp[0].content.toLowerCase() == "cancel") {
									await m2.delete();
									await resp[0].delete();
									return
								}
								embed.title = resp[0].content;
								await bot.utils.editPoll(bot, poll.server_id, poll.channel_id, poll.message_id, "title", resp[0].content);
								await bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
								await m2.delete();
								await resp[0].delete();
								break;
							case "2":
								await m2.edit("Enter the new description. You have two minutes to do this, or you can type `cancel` to cancel");
								resp = await msg.channel.awaitMessages(m => m.author.id == user, {time: 120000, maxMatches: 1});
								if(!resp || !resp[0]) { 
									var errmsg = msg.channel.createMessage("ERR: timed out. Aborting");
									setTimeout(()=> errmsg.delete(), 15000);
									return;
								}
								if(resp[0].content.toLowerCase() == "cancel") {
									await m2.delete();
									await resp[0].delete();
									return
								}
								embed.description = resp[0].content;
								await bot.utils.editPoll(bot, poll.server_id, poll.channel_id, poll.message_id, "description", resp[0].content);
								await bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
								await m2.delete();
								await resp[0].delete();
								break;
							case "3":
								await m2.edit("Enter the new choices. These should be separated by new lines. You have five minutes to do this, or you can type `cancel` to cancel\nNOTE: This will clear current votes");
								resp = await msg.channel.awaitMessages(m => m.author.id == user, {time: 300000, maxMatches: 1});
								if(!resp || !resp[0]) { 
									var errmsg = msg.channel.createMessage("ERR: timed out. Aborting");
									setTimeout(()=> errmsg.delete(), 15000);
									return;
								}
								if(resp[0].content.toLowerCase() == "cancel") {
									await m2.delete();
									await resp[0].delete();
									return
								}

								var choices = resp[0].content.split("\n").map(c => {
									return {option: c, count: 0}
								});

								embed.fields = choices.map((c, i) => {
									return {name: `:${bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} votes`}
								})
								await bot.utils.editPoll(bot, poll.server_id, poll.channel_id, poll.message_id, "choices", choices);
								await bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
								await m2.delete();
								await resp[0].delete();
								break;
							default:
								var errmsg = msg.channel.createMessage("ERR: timed out. Aborting")
								break;
						}
					}
					break;
				case "❓":
				case "❔":
					var ch = await bot.getDMChannel(user);
					if(ch) {
						if(!poll.choices.find(c => c.voters && c.voters.includes(user))) ch.createMessage("You haven't voted for that poll yet");
						else {
							var choice = poll.choices.find(c => c.voters && c.voters.includes(user));
							ch.createMessage(`Your vote: **${choice.option}**`);
						}
					}
					await bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
					break;
			}
		}
	}
})

bot.on("messageReactionRemove", async (msg, emoji, user) => {
	if(bot.user.id == user) return;
	if(msg.channel.guild) {
		var em;
		if(emoji.id) em = `:${emoji.name}:${emoji.id}`;
		else em = emoji.name;

		var message = await bot.getMessage(msg.channel.id, msg.id);
		await bot.utils.updateStarPost(bot, msg.channel.guild.id, msg.id, {emoji: em, count: message.reactions[em.replace(/^:/,"")] ? message.reactions[em.replace(/^:/,"")].count : 0})
	}
})

bot.on("messageDelete", async (msg) => {
	if(!msg.channel.guild) return;
	await bot.utils.deleteReactPost(bot, msg.channel.guild.id, msg.id);
	await bot.utils.deletePoll(bot, msg.channel.guild.id, msg.channel.id, msg.id);
	bot.db.query(`DELETE FROM starboard WHERE server_id=? AND message_id=?`,[msg.channel.guild.id, msg.id]);

})

bot.on("messageDeleteBulk", async (msgs) => {
	if(!msg.channel.guild) return;
	await bot.utils.deletePollsByID(bot, msgs[0].channel.guild.id, msgs.map(msg => msg.id));
})

bot.on("channelDelete", async (channel) => {
	if(!msg.channel.guild) return;
	await bot.utils.deletePollsByChannel(bot, channel.guild.id, channel.id);
})



//----------------------------------------------------------------------------------------------------//

setup();
bot.connect()
.catch(e => console.log("Trouble connecting...\n"+e))
