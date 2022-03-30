const {
	Client,
	Intents,
	Options
} = require("discord.js"); // our lib
const fs 		= require("fs"); // also part of above

require("dotenv").config(); // handles your .env, mainly for windows

const bot = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_MEMBERS
	],
	partials: [
		'MESSAGE',
		'USER',
		'CHANNEL',
		'GUILD_MEMBER',
		'REACTION'
	],
	makeCache: Options.cacheWithLimits({
		MessageManager: 0,
		ThreadManager: 0
	})
});

bot.status = 0; // determines below
bot.prefix = process.env.PREFIX; // the bot's prefix
bot.invite = process.env.INVITE; // the bot's invite
const statuses = [
	// function makes sure it's accurate
	() => `/help | in ${bot.guilds.size} guilds`,
	() => `/help | serving ${bot.users.size} users`
]

// handles the bot's activity stuff
const updateStatus = function(){
	var status = statuses[bot.status % statuses.length];
	bot.user.setActivity(typeof status == 'function' ? status() : status)
	bot.status++;
	
	setTimeout(()=> updateStatus(), 600000)
}

// actual setup
async function setup() {
	var files;
	bot.db = await require('./stores/__db.js')(bot); //our database and stores

	// events unneeded for now bc of stores and handlers managing their own events
	// files = fs.readdirSync("./events");
	// files.forEach(f => bot.on(f.slice(0,-3), (...args) => require("./events/"+f)(...args,bot)));

	bot.utils = {};
	files = fs.readdirSync("./utils");
	files.forEach(f => Object.assign(bot.utils, require("./utils/"+f)));

	bot.handlers = {};
	files = fs.readdirSync(__dirname + "/handlers");
	files.forEach(f => bot.handlers[f.slice(0,-3)] = require(__dirname + "/handlers/"+f)(bot));
}

bot.writeLog = async (log) => {
	let now = new Date();
	let ndt = `${(now.getMonth() + 1).toString().length < 2 ? "0"+ (now.getMonth() + 1) : now.getMonth()+1}.${now.getDate().toString().length < 2 ? "0"+ now.getDate() : now.getDate()}.${now.getFullYear()}`;
	if(!fs.existsSync('./logs')) fs.mkdirSync('./logs');
	if(!fs.existsSync(`./logs/${ndt}.log`)){
		fs.writeFile(`./logs/${ndt}.log`,log+"\r\n",(err)=>{
			if(err) console.log(`Error while attempting to write log ${ndt}\n`+err.stack);
		});
	} else {
		fs.appendFile(`./logs/${ndt}.log`,log+"\r\n",(err)=>{
			if(err) console.log(`Error while attempting to apend to log ${ndt}\n`+err);
		});
	}
}

setup();
bot.login(process.env.TOKEN)
.then(()=> console.log("Ready!"));