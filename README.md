# Herobrine

A rewrite of [Steve](https://github.com/greysdawn/Sterv-Boot).

---

**Herobrine** is a semi-temporary Discord bot that serves as a test run for redone/new code.
When he's done, he'll be used repurposed for a private D&D-style RP server we own, but others are free to use him at that point! This repo mainly servers as a place to keep all his code during the rewrite.

Herobrine is made using the [Eris](https://abal.moe/Eris) framework, and utilizes [pg](https://www.npmjs.com/package/pg) for databases (though that will be changed eventually). If you plan to run him on your own machine, he'll need a config file that looks something like this:

```
{

"token" : "biglongthingfromdiscord",

"prefix" : ["hh!","heyhero ","heyherobrine "],
"accepted_ids" : ["yourdiscordidhere"],
"pg" : "postgres.url.com"

}

```

The prefix can be just one word, but it'll take tweaking the code unless you keep it in the array.

`token`: The token from the Discord bot you have registered on your account [here](https://discordapp.com/developers/applications/)
`prefix`: The prefix(es) you want Herobrine to respond to
`accepted_ids`: Your/the bot owner's ID. Made to accept multiple in case of multiple accounts
`pg`: The URL to the postgres database, or whatever other database is being used