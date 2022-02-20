# BaseBot
A Discord bot base for Eris and Discord.js

## What is this?
A bot base! It's got some basic setup, organization, and commands done to help get a bot dev going without worrying about too much setup. It was created mainly for personal use, but there's no reason others shouldn't be able to use it :)

## Setup

### Requirements
This bot base requires `Node.js 12.0` or higher. You'll also want to get `sqlite3` from somewhere- check [here](https://www.sqlite.org/download.html) for pre-compiled binaries, or get it from your favorite package manager. If you're not running Linux, be sure to add it to your path!

**Optional:** You might also want to install [pm2](https://www.npmjs.com/package/pm2) for running the bot. This is a process manager that treats programs like daemons and runs them in the background

### Environment Vars
After getting your requirements, the thing you need to set the bot up is a `.env` file that looks something like the following:
```env
TOKEN=inserttokenthingiehere
PREFIX=bb!
OWNER=yourdiscordidhere
```

You can also rename `.env.example` to just `.env` and use that. Remember to replace the token with whatever your bot's token is, and set the prefix to be whatever you want the bot to respond to

**Note:** Your ID is the digits that Discord gives you when you right click or tap and hold on your profile and select "Copy ID." It is NOT your username#1234. This is a very common mistake!

## Commands
*Commands* are the bulk of what a Discord bot is. These are functions that often execute differently depending on the context and content of a message. This BaseBot handles commands based on files 

### How do I add commands?
Adding commands is super easy. Just follow these steps:

1. Create a file for the command in `/commands` or `/commands/[module name]`. The name should be `cmdname.js`, where `cmdname` is the name of your command (eg: `ping.js`)

2. Set the file up to look something like this:
```js
// NOTE: help, usage, and desc are FUNCTIONS. This is in case we want to add more
// 	to it later, like dynamically inserting the bot's prefix
module.exports = {
	help: ()=> "Ping the bot!", //A line stating what the bot does
	usage: ()=> [" - Returns a ping message"] //An array containing info on how to use the command
	desc: ()=> "This command's responses are randomized!", //Extra info, usually about args
	execute: async (bot, msg, args) => {
		//actual command code goes here
		let pings = ["Pong", "Pang", "Peng", "Pung"];
		return pings[Math.floor(Math.random()*pings.length)] + "!";
	},
	alias: ["pong"], //aliases for the command
	permissions: [], //what permissions are required to use the command. check the lib for these
	guildOnly: false, //should the comman only be used in guilds?
	subcommads: {} //for handling subcommands
}
```

3. That's it! Your command will be automatically added to the bot next time you restart it

### How do I give a command subcommands?
Subcommands go in the same file as their parent command. To add a subcommand, add the line `subcommands: {}` somewhere in your `module.exports` object, and then put this underneath the main command:
```js
module.exports.subcommands.cmdname = {
	//use the same format as the main command!
}
```
You can also set another variable to hold your `module.exports` in order to make subcommand adding easier

NOTE: Subcommands are only handled *one level deep.* Nesting subcommands isn't recommended- use `switch` statements or `if else` blocks in order to handle simulated subcommand nesting

### What do subcommands inherit?
- The module that the main command is part of (**cannot** be overwritten)
- Any permissions that the main command requires (**can** be overwritten)
- The `guildOnly` status of the main command (**can** be overwritten)

## Modules
*Modules* hold commands. They aren't required, however. If you want to make a bot without worrying about handling modules, go ahead and just stick all your commands in `/commands` without worrying about 'em

### How do I add modules?
1. Create a folder named `Module Name` in `/commands`. Replace `Module Name` with the actual module name. **OPTIONAL:** Keep the proper casing in order to make things display nicely

2. Create a file called `__mod.js` in the folder you just added

3. Add something like this to that file:
```js
module.exports = {
	color: "aaaaaa", //hex color for the embed. default is #aaaaaa (DON'T INCLUDE #)
	description: "A fun li'l module!", //description of the module
	alias: [] //array of aliases for the module, eg: "utils" for a module called "utilities"
}
```

4. You're done! To add commands to the module, just put them in the folder you made

## Events
The current setup comes with a couple example events that you can edit as you see fit. These are the `messageCreate` event, the `messageReactionAdd` event, and the `messageReactionRemove` even. All events handled in `/events` are ones related to the Discord API, so don't put things meant for `process.on` in there!

## How do I add events?
1. Make a file in `/events`. The name should correspond to the event you want it to handle, eg: `message` handles `MESSAGE_CREATE` events in Discord.js. Be sure to name it correctly based on the lib you're using- Eris uses `messageCreate` for message creation while D.js uses `message`. Other differences may also exist

2. Put something like this in your file:
```js
//the args for the function are the normal args passed into the event
//  + an arg for the bot itself to be passed into the event
//  don't forget to add the bot arg!
module.exports = async (message, bot) => {
	console.log(message.content); //what you want your code to do
}
```

3. You're done! The bot will now handle whatever event you added

## Other Stuff

### Like what we do? Consider supporting us!
[Ko-Fi](https://ko-fi.com/greysdawn)  
[Patreon](https://patreon.com/greysdawn)

### Need help? Join this
[Support Server](https://discord.gg/EvDmXGt)

### Want to know how to make bots? Check these out!
[Guide to Discord.js](https://discordjs.guide/)  
[An Idiot's Guide to Bot Making](https://anidiots.guide/)  
[AIG's Video Tutorials](https://www.youtube.com/watch?v=rVfjZrqoQ7o&list=PLR2_rarYLHfg6ZJqq0WTMmI9uLcd7_GRO)

### Want us to make a bot for you?
We do commissions! Check out [this doc](https://docs.google.com/document/d/1hvqvqdWj0mpHeNjo_mr2AHF7La32nkp4BDLxO1dvTHw/edit?usp=drivesdk) for more info
