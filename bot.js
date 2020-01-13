/*

Steve Bot Version 2.0 Official [Herobrine] (LOCAL)
Begin work date: 07 September 2017
Official "birthday": 25 September 2017

---------------------------------------------------------------------------------------------
*/

const Eris 		= require("eris-additions")(require("eris")); //lib we're actually using
const Discord 	= require("discord.js"); //just for collections
const dblite 	= require("dblite").withSQLite('3.8.6+');
const exec 		= require("child_process").exec;
const config 	= require ("./config.json");
const chrono 	= require('chrono-node');

var status 		= 0;

const bot 		= new Eris(config.token,{restMode: true});

bot.cfg 		= config;
bot.strings 	= require('./strings.json');
bot.fetch 		= require('node-fetch');
bot.duri 		= require('datauri');
bot.tc 			= require('tinycolor2');
bot.fs 			= require('fs');
bot.moment 		= require('moment')
bot.chrono 		= new chrono.Chrono();
bot.scheduler 	= require('node-schedule');

bot.commands 	= {};
bot.modules 	= {};
bot.reminders 	= {};

bot.paused = false;

bot.cur_logs = "";

bot.customActions = [
	{name: "member.hr", 	 replace: "msg.member.hasRole"},
	{name: "member.rr", 	 replace: "await msg.member.removeRole"},
	{name: "member.ar", 	 replace: "await msg.member.addRole"},
	{name: "member.bl", 	 replace: "await bot.commands.blacklist.execute(bot, msg, [msg.member.id])"},
	{name: "args.hr", 		 replace: (arg) => "msg.guild.members.find(m => m.id == "+arg+").hasRole"},
	{name: "args.rr", 		 replace: (arg) => "await msg.guild.members.find(m => m.id == "+arg+").removeRole"},
	{name: "args.ar", 		 replace: (arg) => "await msg.guild.members.find(m => m.id == "+arg+").addRole"},
	{name: "args.bl", 		 replace: (arg) => "await bot.commands.blacklist.subcommands.add.execute(bot, msg, [msg.guild.members.find(m => m.id == "+arg+").id])"},
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
		[
		"Error opening database with dblite.",
		"You may need to set sqlite's location in config",
		"and uncomment the dblite.bin line in bot.js (line 60).",
		"This can be fixed by adding sqlite3.exe to your path,",
		"or installing it with a package manager, if applicable."
		].join("\n") + "\nError:\n"+e);
	process.exit(1);
}

bot.AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

/***********************************
SETUP
***********************************/

//TODO: set up command stuff
const recursivelyReadDirectory = function(dir) {
	var results = [];
	var files = bot.fs.readdirSync(dir, {withFileTypes: true});
	for(file of files) {
		if(file.isDirectory()) {
			results = results.concat(recursivelyReadDirectory(dir+"/"+file.name));
		} else {
			results.push(dir+"/"+file.name);
		}
	}

	return results;
}

const registerCommand = function({command, module, name} = {}) {
	if(!command) return;
	command.module = module;
	command.name = name;
	module.commands.set(name, command);
	bot.commands.set(name, command);
	bot.aliases.set(name, name);
	if(command.alias) command.alias.forEach(a => bot.aliases.set(a, name));
	
	if(command.subcommands) {
		var subcommands = command.subcommands;
		command.subcommands = new Discord.Collection();
		Object.keys(subcommands).forEach(c => {
			var cmd = subcommands[c];
			cmd.name = `${command.name} ${c}`;
			cmd.parent = command;
			cmd.module = command.module;
			if(!command.sub_aliases) command.sub_aliases = new Discord.Collection();
			command.sub_aliases.set(c, c);
			if(cmd.alias) cmd.alias.forEach(a => command.sub_aliases.set(a, c));
			if(command.permissions && !cmd.permissions) cmd.permissions = command.permissions;
			if(command.guildOnly != undefined && cmd.guildOnly == undefined)
				cmd.guildOnly = command.guildOnly;
			command.subcommands.set(c, cmd);
		})
	}
	return command;
}

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

	//FINALLY alphabetized
	bot.db.query(`CREATE TABLE IF NOT EXISTS aliases (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	TEXT,
		name 		TEXT,
		command 	TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS bundles (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	TEXT,
		name 		TEXT,
		description TEXT,
		roles 		TEXT,
		assignable 	INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS commands (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	BIGINT,
		name 		TEXT,
		actions 	TEXT,
		target 		TEXT,
		del 		INTEGER
	)`);

	//default config: {srv_id: "", prefix: "", welcome: {}, autoroles: "", disabled: {}, opped: "", feedback: {}, logged: [], autopin: 2}
	bot.db.query(`CREATE TABLE IF NOT EXISTS configs (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	TEXT,
		prefix 		TEXT,
		welcome 	TEXT,
		autoroles 	TEXT,
		disabled 	TEXT,
		opped 		TEXT,
		feedback 	TEXT,
		logged 		TEXT,
		autopin 	TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS feedback (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid			TEXT,
		server_id	TEXT,
		sender_id 	TEXT,
		message 	TEXT,
		anon 		INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS feedback_configs (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	TEXT,
		channel_id	TEXT,
		anon 		BOOLEAN
	)`);

	// not ready yet
	// bot.db.query(`CREATE TABLE IF NOT EXISTS invites (
	// 	id 			INTEGER PRIMARY KEY AUTOINCREMENT,
	// 	server_id 	TEXT,
	// 	invite_id 	TEXT,
	// 	name 		TEXT
	// )`);

	// bot.db.query(`CREATE TABLE IF NOT EXISTS logging_configs (
	// 	id 			INTEGER PRIMARY KEY AUTOINCREMENT,
	// 	server_id 	TEXT,
	// 	channel_id	TEXT,
	// 	events	 	TEXT
	// )`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS notes (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		user_id 	TEXT,
		title 		TEXT,
		body 		TEXT
	)`);

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
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS profiles (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id 	TEXT,
		title 		TEXT,
		bio 		TEXT,
		color 		TEXT,
		badges 		TEXT,
		lvl 		INTEGER,
		exp 		INTEGER,
		cash 		INTEGER,
		daily 		INTEGER,
		disabled 	INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS reactcategories (
    	id 			INTEGER PRIMARY KEY AUTOINCREMENT,
    	hid 		TEXT,
    	server_id	BIGINT,
    	name 		TEXT,
    	description TEXT,
    	roles 		TEXT,
    	posts 		TEXT
    )`);

    bot.db.query(`CREATE TABLE IF NOT EXISTS reactposts (
		id			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		channel_id	TEXT,
		message_id	TEXT,
		roles		TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS reactroles (
    	id 			INTEGER PRIMARY KEY AUTOINCREMENT,
    	server_id	BIGINT,
    	role_id 	BIGINT,
    	emoji 		TEXT,
    	description TEXT
    )`);

    bot.db.query(`CREATE TABLE IF NOT EXISTS reminders (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		user_id 	TEXT,
		note 		TEXT,
		time 		TEXT,
		recurring 	INTEGER,
		interval	TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS responses (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		name 		TEXT,
		value 		TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS roles (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	TEXT,
		role_id 	TEXT,
		description TEXT,
		assignable 	INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS starboards (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	TEXT,
		channel_id	TEXT,
		emoji		TEXT,
		override	INTEGER,
		tolerance	INTEGER
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS starred_messages (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id	TEXT,
		channel_id	TEXT,
		message_id 	TEXT,
		original_id TEXT,
		emoji 		TEXT
	)`); //emoji is to keep track of posts from multiple boards

	bot.db.query(`CREATE TABLE IF NOT EXISTS strikes (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		server_id 	TEXT,
		user_id 	TEXT,
		reason 		TEXT
	)`);

	bot.db.query(`CREATE TABLE IF NOT EXISTS triggers (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		hid 		TEXT,
		user_id 	TEXT,
		name 		TEXT,
		list 		TEXT,
		private		INTEGER
	)`);

	files = bot.fs.readdirSync("./events");
	files.forEach(f => {
		bot.on(f.slice(0,-3), (...args) => require("./events/"+f)(...args,bot));
	});

	bot.utils = {};
	files = bot.fs.readdirSync("./utils");
	files.forEach(f => Object.assign(bot.utils, require("./utils/"+f)));

	files = recursivelyReadDirectory("./commands");

	bot.modules = new Discord.Collection();
	bot.commands = new Discord.Collection();
	bot.aliases = new Discord.Collection();
	for(f of files) {
		var path_frags = f.replace("./commands/","").split(/(?:\\|\/)/);
		var mod = path_frags.length > 1 ? path_frags[path_frags.length - 2] : "Unsorted";
		var file = path_frags[path_frags.length - 1];
		if(!bot.modules.get(mod.toLowerCase())) {
			var mod_info = require(file == "__mod.js" ? f : f.replace(file, "__mod.js"));
			bot.modules.set(mod.toLowerCase(), {...mod_info, name: mod, commands: new Discord.Collection()})
		}
		if(file == "__mod.js") continue;

		mod = bot.modules.get(mod.toLowerCase());
		if(!mod) {
			console.log("Whoopsies");
			continue;
		}
		
		registerCommand({command: require(f), module: mod, name: file.slice(0, -3).toLowerCase()})
	}
}

bot.writeLog = (bot, type, msg) => {
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

bot.formatDiff = (date1, date2, shorthand = false) => {
	date1 = new bot.moment(date1);
	date2 = new bot.moment(date2);
	var duration = bot.moment.duration(Math.abs(date1.diff(date2))).add(1, "s");

	var parsed = [
		`${duration.days() > 0 ? duration.days()+(shorthand ? " d" : (duration.days() > 1 ? " days" : " day")) : ""}`,
		`${duration.hours() > 0 ? duration.hours()+(shorthand ? " h" : (duration.hours() > 1 ? " hours" : " hour")) : ""}`,
		`${duration.minutes() > 0 ? duration.minutes()+(shorthand ? " m" : (duration.minutes() > 1 ? " minutes" : " minute")) : ""}`,
		`${duration.seconds() > 1 ? duration.seconds()+(shorthand ? " s" : " seconds") : ""}`
	].filter(x => x!="").map((v,i,a) => {
		if(a.length > 1) {
			if(i != a.length-1) {
				return v+(a.length > 2 ? ", " : " ");
			} else return "and "+v
		} else {
			return v
		}
	}).join("");

	return parsed;
}

bot.parseCommand = async function(bot, msg, args) {
	if(!args[0]) return undefined;
	
	var command = bot.commands.get(bot.aliases.get(args[0].toLowerCase()));
	if(!command) {
		command = await bot.utils.getAlias(bot, msg.guild.id, args[0].toLowerCase());
		if(!command) return {command, nargs: args};
		return await bot.parseCommand(bot, msg, command.command.split(" ").concat(args.slice(1)));
	}

	args.shift();

	if(args[0] && command.subcommands && command.subcommands.get(command.sub_aliases.get(args[0].toLowerCase()))) {
		command = command.subcommands.get(command.sub_aliases.get(args[0].toLowerCase()));
		args.shift();
	}

	return {command, nargs: args};
}

bot.parseCustomCommand = async function(bot, msg, args) {
	return new Promise(async res => {
		if(!args || !args[0]) return res(undefined);
		if(!msg.guild) return res(undefined);
		var name = args.shift().toLowerCase();
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
			await bot.utils.asyncForEach(cmd.newActions, async (a) => {
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

		res({command: cmd, nargs: args, name})
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
}


bot.on("ready",async ()=>{
	console.log("Ready.");
	bot.writeLog(bot, "startup");
	updateStatus();
	setInterval(updateStatus, 600000);

	var today = new Date();
	var reminders = await bot.utils.getAllReminders(bot);
	await Promise.all(reminders.map(async r => {
		var time = new Date(r.time);
		if(time < today) {
			await bot.utils.sendReminder(bot, r.user_id, r.hid);
		} else {
			bot.reminders[r.user_id+"-"+r.hid] = bot.scheduler.scheduleJob(time, ()=> bot.utils.sendReminder(bot, r.user_id, r.hid))
		}
	}))
})

//----------------------------------------------------------------------------------------------------//

setup();
bot.connect()
.catch(e => console.log("Trouble connecting...\n"+e))
