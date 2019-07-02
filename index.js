const fs 		= require('fs');
const path 		= require('path');
const express 	= require('express');
const eris 		= require('eris');

require('dotenv').config();

const app = express();

const bot = eris(process.env.TOKEN_HEROBRINE);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.commands = {};

async function setup() {
	var files = fs.readdirSync(path.join(__dirname, "commands"));
	files.forEach(f => {
		app.commands[f.slice(0,-3)] = require(path.join(__dirname, "commands", f));
	})
	// app.commands['adbundle'] = require(path.join(__dirname, "commands", "adbundle"));
	console.log("Commands loaded");
	
}

async function getCommand(cmd) {
	return new Promise(res => {
		if(!cmd) return res(false);
		cmd = cmd.toLowerCase();
		var command = app.commands[cmd];
		if(!command) return res(undefined);
		res({name: cmd, data: app.commands[cmd]});
	})
}

async function getCommands() {
	return new Promise(res => {
		var cmds = Object.keys(app.commands).map(k => {
			return {name: k, data: app.commands[k]}
		});
		res(cmds);
	})
}

app.get('/commands', async (req, res)=> {
	var cmd = await getCommands();
	 console.log(cmd);
	res.send(cmd);
})

app.get('/info', async (req, res)=> {
	res.send({guilds: bot.guilds.size, users: bot.users.size});
})

app.get('/', async (req, res)=> {
	var index = fs.readFileSync(path.join(__dirname,'frontend','build','index.html'),'utf8');
	index = index.replace('$TITLE','Herobrine Docs')
				 .replace('$DESC','Documentation for a bot called Herobrine')
				 .replace('$TWITDESC','Documentation for a bot called Herobrine')
				 .replace('$TWITTITLE','Herobrine Docs')
				 .replace('$OGTITLE','Herobrine Docs')
				 .replace('$OGDESC','Documentation for a bot called Herobrine')
				 .replace('$OEMBED','oembed.json');
	res.send(index);
})

app.use(express.static(path.join(__dirname, 'frontend','build')));

app.use(async (req, res)=> {
	var index = fs.readFileSync(path.join(__dirname,'frontend','build','index.html'),'utf8');
	index = index.replace('$TITLE','Herobrine Docs')
				 .replace('$DESC','Documentation for a bot called Herobrine')
				 .replace('$TWITDESC','Documentation for a bot called Herobrine')
				 .replace('$TWITTITLE','Herobrine Docs')
				 .replace('$OGTITLE','Herobrine Docs')
				 .replace('$OGDESC','Documentation for a bot called Herobrine')
				 .replace('$OEMBED','oembed.json');
	res.send(index);
})

setup();
console.log("Herobrine ready.");
// module.exports = app;
bot.connect();
app.listen(8080);