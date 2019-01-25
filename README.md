# Herobrine

A rewrite of [Steve](https://github.com/greysdawn/steve).

---

**Herobrine** is a semi-temporary Discord bot that serves as a test run for redone/new code.
When he's done, he'll be used repurposed for a private D&D-style RP server we own, but others are free to use him at that point! This repo mainly servers as a place to keep all his code during the rewrite.

This version of Herobrine is made using the [Eris](https://abal.moe/Eris) framework, and utilizes [dblite](https://www.npmjs.com/package/dblite) for local databases. If you plan to run him on your own machine, he'll need a config file that looks something like this:

```
{

"token" : "biglongthingfromdiscord",

"prefix" : ["hh!","heyhero ","heyherobrine "],
"accepted_ids" : ["yourdiscordidhere"],
"sqlite": "./path/to/sqlite/executable.exe"

}

```

The prefix can be just one word, but it'll take tweaking the code unless you keep it in the array.

`token`: The token from the Discord bot you have registered on your account [here](https://discordapp.com/developers/applications/).    
`prefix`: The prefix(es) you want Herobrine to respond to.    
`accepted_ids`: Your/the bot owner's ID. Made to accept multiple in case of multiple accounts.    
`sqlite`: The path to your sqlite3 executable. Fixes "kill einvalid" errors on Windows, may not be needed for other platforms. This can be fixed if the folder where sqlite3.exe is located is in your PATH already
