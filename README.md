# Herobrine

A rewrite of [Steve](https://github.com/greysdawn/steve).

---

**Herobrine** is a work in progress Discord bot that includes a variety of moderation and fun commands. At the moment, he's receiving a **complete overhaul**, switching from Eris to Discord.js and focusing on slash commands

**Use this bot in its current state at your own risk.** Once the rewrite is done, he'll be released into the ecosystem and this page will get a big update

## Self-hosting
### Self-hosting is not currently recommended
That said, here are the steps:

1. Download this repo and extract to somewhere easy to access
1. Run `npm install`
1. Fill in the `config.json` (see below)
1. Run `node bot` to get them up and running

### config.json
This is the file that handles configuration, as opposed to a `.env` file. Here's a sample you can use:
```json
{

    "token" : "biglongthingfromdiscord",

    "prefix" : ["hh!","heyhero ","heyherobrine "],
    "accepted_ids" : ["yourdiscordidhere"],
    "sqlite": "./path/to/sqlite/executable.exe",
    "update": false
}
```

The prefix can be just one word, but it'll take tweaking the code unless you keep it in the array.

**Explanations**  
`token`: The token from the Discord bot you have registered on your account [here](https://discordapp.com/developers/applications/).    
`prefix`: The prefix(es) you want Herobrine to respond to.    
`accepted_ids`: Your/the bot owner's ID. Made to accept multiple in case of multiple accounts.    
`sqlite`: The path to your sqlite3 executable. Fixes "kill einvalid" errors on Windows, may not be needed for other platforms. This can be fixed if the folder where sqlite3.exe is located is in your PATH already    
`update`: This is for self-updates. Check the next section for info.

## Self-Updates
If you want the bot to self-update, initialize a git repo in the same directory as the `bot.js` file and point a remote to wherever you want to get it from. Next, edit your config to look something like this:

```json
{
    "token" : "biglongthingfromdiscord",

    "prefix" : ["hh!","heyhero ","heyherobrine "],
    "accepted_ids" : ["yourdiscordidhere"],
    "sqlite": "./path/to/sqlite/executable.exe",
    "update" : false,
    "remote" : "origin",
    "branch" : "master"
}
```

`remote`: The remote's name from when you added it to the repo.
`branch`: The branch name you want to pull from.

**NOTE:** This is for people who know what they're doing. Also, you may have to push the bot's files into your repo before pulling from it. *We are not responsible for anything going wrong.*
