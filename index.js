const fs 		= require('fs');
const path 		= require('path');
const express 	= require('express');
const eris 		= require('eris');
const showdown  = require('showdown');

showdown.setOption('simplifiedAutoLink', true);
showdown.setOption('simpleLineBreaks', true);
showdown.setOption('openLinksInNewWindow', true);
showdown.setOption('underline', true);
showdown.setOption('strikethrough', true);
showdown.setOption('tables', true);
showdown.setOption('tasklists', true);

require('dotenv').config();

const app = express();

const bot = eris(process.env.TOKEN_HEROBRINE);

const converter = new showdown.Converter();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.commands = {};

// async function setup() {
// 	var files = fs.readdirSync(path.join(__dirname, "commands"));
// 	files.forEach(f => {
// 		app.commands[f.slice(0,-3)] = (fs.readFileSync(path.join(__dirname, "commands", f))).toString();
// 	})
// 	// app.commands['adbundle'] = require(path.join(__dirname, "commands", "adbundle"));
// 	console.log("Commands loaded");
// }

async function getCommand(cmd) {
	return new Promise(res => {
		if(!cmd) return res(undefined);
		cmd = cmd.toLowerCase();
		if(!fs.existsSync(path.join(__dirname, "commands", cmd))) return res(undefined);
		var command = (fs.readFileSync(path.join(__dirname, "commands", f))).toString();
		res({name: cmd, data: converter.makeHtml(command)});
	})
}

async function getCommands() {
	return new Promise(res => {
		var commands = [];
		var files = fs.readdirSync(path.join(__dirname, "commands"));
		files.forEach(f => {
			commands.push({name: f.slice(0, -3), data: converter.makeHtml((fs.readFileSync(path.join(__dirname, "commands", f))).toString())})
		})
		// var cmds = Object.keys(commands).map(k => {
		// 	return {name: k, data: converter.makeHtml(commands[k])}
		// });
		res(commands);
	})
}

app.get('/api/commands', async (req, res)=> {
	var cmd = await getCommands();
	res.send(cmd);
})

app.get('/api/info', async (req, res)=> {
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

app.get('/commands/:cmd', async (req, res)=> {
	var cmd = await getCommand(req.params.cmd);
	if(!cmd) cmd = {name: "404"}
	var index = fs.readFileSync(path.join(__dirname,'frontend','build','index.html'),'utf8');
	index = index.replace('$TITLE',cmd.name + ' | Herobrine Docs')
				 .replace('$DESC','Documentation for a bot called Herobrine')
				 .replace('$TWITDESC','Documentation for a bot called Herobrine')
				 .replace('$TWITTITLE',cmd.name + ' | Herobrine Docs')
				 .replace('$OGTITLE',cmd.name + ' | Herobrine Docs')
				 .replace('$OGDESC','Documentation for a bot called Herobrine')
				 .replace('$OEMBED','oembed.json');
	res.send(index);
})

app.get('/commands', async (req, res)=> {
	var index = fs.readFileSync(path.join(__dirname,'frontend','build','index.html'),'utf8');
	index = index.replace('$TITLE','Commands | Herobrine Docs')
				 .replace('$DESC','Documentation for a bot called Herobrine')
				 .replace('$TWITDESC','Documentation for a bot called Herobrine')
				 .replace('$TWITTITLE','Commands | Herobrine Docs')
				 .replace('$OGTITLE','Commands | Herobrine Docs')
				 .replace('$OGDESC','Documentation for a bot called Herobrine')
				 .replace('$OEMBED','oembed.json');
	res.send(index);
})

app.get('/dashboard', async (req, res)=> {
	var index = fs.readFileSync(path.join(__dirname,'frontend','build','index.html'),'utf8');
	index = index.replace('$TITLE','Dashboard | Herobrine Docs')
				 .replace('$DESC','Documentation for a bot called Herobrine')
				 .replace('$TWITDESC','Documentation for a bot called Herobrine')
				 .replace('$TWITTITLE','Dashboard | Herobrine Docs')
				 .replace('$OGTITLE','Dashboard | Herobrine Docs')
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

// setup();
console.log("Herobrine ready.");
// module.exports = app;
bot.connect();
app.listen(process.env.PORT || 8080);