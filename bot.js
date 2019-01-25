/*

Steve Bot Version 2.0 Official [Herobrine] (REMOTE)
Begin work date: 07 September 2017
Official "birthday": 25 September 2017

---------------------------------------------------------------------------------------------
*/

const Eris = 		require("eris-additions")(require("eris")); //da lib
const fs =			require("fs"); //file stuff
const {Client} =	require("pg"); //postgres, for data things
const dblite =		require('dblite').withSQLite('3.8.6+'); //dblite, also for data things
const pimg =		require('pngjs-image'); //for image manipulation
const helptext =	require("./help.js"); //help text
const config =		require('./config.json'); //configs
const Texts =		require('./strings.json'); //json full of text for different things
const Util =		require("./utilities.js");

var cur_logs =		"";

const bot = new Eris.CommandClient(config.token,{},{
	name: "Herobrine",
	description: "Temporary test rewrite of Steve",
	owner: "The Grey Skies",
	prefix: config.prefix,
	defaultHelpCommand: false
});

//commenting the line below may cause "kill einvalid" errors on some computers;
//make sure the config is set up if you're getting issues
// dblite.bin = config.sqlite;

var db;

try{
	db = dblite("./data.sqlite","-header");
} catch(e){
	console.log(
		["Error opening database with dblite.",
		"You may need to set sqlite's location in config",
		"and uncomment the dblite.bin line in bot.js (line 32)"
		].join("\n"))
}


/***********************************
SETUP
***********************************/

const setup = async function(){

	db.query(".databases");
	db.query(`SELECT * FROM triggers`,(err,rows)=>{
		if(err){
			db.query(`CREATE TABLE IF NOT EXISTS triggers (user_id TEXT, code TEXT, list TEXT, alias TEXT)`,(err,rows)=>{
				if(err){
					console.log("Triggers doesn't exist or there was an error")
				}
			});
		}
	});
}


/***********************************
COMMANDS
***********************************/

const commands={};

commands.help = bot.registerCommand("help",(msg,args)=>{
	msg.channel.createMessage({embed: helptext.help2});
})

bot.registerCommandAlias("h","help")

//- - - - - - - - - - - Triggers - - - - - - - - - -

commands.trigs=bot.registerCommand("trigs",(msg,args)=>{
	if(args.length==0){
		var tgs=[];
		db.query(`SELECT * FROM triggers WHERE user_id='${msg.author.id}'`,(err,rows)=>{
			if(err){
				console.log(err)
			}
			tgs=rows.map(t=>t.alias+": "+t.code);
		})

		setTimeout(function(){
			msg.channel.createMessage((tgs.length>0 ? {embed:{title:"triggers",fields:[{name:"alias: code",value:tgs.join("\n")}]}} : "You have no registered trigger lists."))
		},500)

	} else {
		db.query(`SELECT * FROM triggers WHERE code='${args[0]}'`,(err,rows)=>{
			list=rows[0];
			if(list){
				msg.channel.createMessage({embed:{
					title:"Triggers for "+list.alias,
					description: list.list.split(/,\s*/g).join("\n"),
					color: 11433333
				}})
			} else {
				msg.channel.createMessage("That list wasn't found.");
			}
		});
	}
},{
	description: "Used for indexing triggers",
	fullDescription: "Indexes triggers so that they can be easily shown to others"
});

commands.trigs.registerSubcommand("help",(msg,args)=>{
	msg.channel.createMessage({embed: helptext.trigs})
})

commands.trigs.registerSubcommand("new",(msg,args)=>{
	let cd=Util.genCode(4,Texts.codestab);
	let listname = "";

	msg.channel.createMessage("Please enter a name/alias for the list");
	msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:20000,maxMatches:1}).then(tlname=>{
		if(tlname.length>0){
			if(tlname[0].content.toLowerCase()=="cancel"){ return msg.channel.createMessage("Action cancelled.") }
			listname=tlname[0].content;
			msg.channel.createMessage("Type (preferably, comma, separated) triggers to add to the list. You have 60 seconds to do this.").then(()=>{
				msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time:60000,maxMatches:1}).then(trigs_received=>{
					if(trigs_received.length>0){
						if(trigs_received[0].content.toLowerCase()=="cancel"){ return msg.channel.createMessage("Action cancelled.")}
						db.query(`INSERT INTO triggers VALUES (?,?,?,?)`,[msg.author.id,cd,trigs_received[0].content,listname],(err,rows)=>{
							if(err){
								console.log(err);
								msg.channel.createMessage("There was an error.");
							} else {
								msg.channel.createMessage("List created. Code: "+cd);
							}
						});
					} else {
						msg.channel.createMessage("Action cancelled.");
					}
				})
			});
		} else {
			console.log("Error: no message received");
			msg.channel.createMessage("Action cancelled.");
		}
	})

})

commands.trigs.registerSubcommand("delete",(msg,args)=>{
	db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
		tg=rows[0];
		if(!tg){ return msg.channel.createMessage("That list doesn't exist."); }
		if(!(tg.user_id == msg.author.id)){ return msg.channel.createMessage("That list does't belong to you.")}
		msg.channel.createMessage(`Are you sure you want to delete this set? Enter \`${tg.code}\` to delete it.`)
		msg.channel.awaitMessages(m=> m.author.id == msg.author.id,{time:10000,maxMatches:1}).then(resp=>{
			if(resp[0].content.toLowerCase() == tg.code){
				db.query(`DELETE FROM triggers WHERE code='${tg.code}'`).then(()=>{
					msg.channel.createMessage("Deleted.")
				})
			}
		})
	})
})

commands.trigs.registerSubcommand("add",(msg,args)=>{
	db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
		tl = rows[0];
		if(!tl){ return msg.channel.createMessage("List does not exist."); }
		if(!(tl.user_id == msg.author.id)){ return msg.channel.createMessage("That list doesn't belong to you.");}
		if(args.length > 1){
			db.query(`UPDATE triggers SET list='${tl.list},${args.slice(1)}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
				msg.channel.createMessage("Appended to list.");
			})
			return;
		}
		msg.channel.createMessage("Write what you want to add.");
		msg.channel.awaitMessages(m=> m.author.id == msg.author.id,{time:60000,maxMatches:1}).then(resp=>{
			db.query(`UPDATE triggers SET list='${tl.list},${resp[0].content}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
				msg.channel.createMessage("Appended to list.")
			})
		})
	})
})


commands.trigs.registerSubcommand("remove",(msg,args)=>{
	db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
		tl = rows[0];
		if(!tl){ return msg.channel.createMessage("List does not exist."); }
		if(!(tl.user_id == msg.author.id)){ return msg.channel.createMessage("That list doesn't belong to you.");}
		var tlist = tl.list;
		if(args.length > 1){
			var rmlist = args.slice(1).join(" ");
			rmlist = rmlist.split(/,\s*/g);
			for(var i=0;i<rmlist.length;i++){
				var rmregex = new RegExp("(?:^|,\\s*)"+rmlist[i]+"(?:$|,\\s*)","i");
				if(tlist.match(new RegExp("^"+rmlist[i]+",\\s*")) || tlist.endsWith(new RegExp(",\\s*"+rmlist[i])+"$")){
					tlist = tlist.replace(new RegExp(",*"+rmlist[i]+",*"),"");
				} else if(tlist.match(rmregex)) {
					tlist = tlist.replace(rmregex,",");
				}
			}
			setTimeout(function(){
				db.query(`UPDATE triggers SET list='${tlist}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
					msg.channel.createMessage("Removed from list.").then(()=>{
						db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
							nlist=rows[0];
							if(!nlist){ console(`Error finding list ${args[0].toLowerCase()} after removing triggers.`) }
							if(nlist.list.replace(/,*/g,"")==""||nlist.list==undefined){
								db.query(`DELETE FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
									msg.channel.createMessage("List is empty; deleted.");
								})
							}
						})
					})
				})
			},500)
			return;
		}
		msg.channel.createMessage("Write what you want to remove.");
		msg.channel.awaitMessages(m=> m.author.id == msg.author.id,{time:60000,maxMatches:1}).then(resp=>{
			var rmlist = resp[0].content.split(/,\s*/g);
			for(var i=0;i<rmlist.length;i++){
				var rmregex = new RegExp("(?:^|,\\s*)"+rmlist[i]+"(?:$|,\\s*)","i");
				if(tlist.match(new RegExp("^"+rmlist[i]+",\\s*")) || tlist.endsWith(new RegExp(",\\s*"+rmlist[i])+"$")){
					tlist = tlist.replace(new RegExp(",*"+rmlist[i]+",*"),"");
				} else if(tlist.match(rmregex)) {
					tlist = tlist.replace(rmregex,",");
				}
			}
			setTimeout(function(){
				db.query(`UPDATE triggers SET list='${tlist}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
					msg.channel.createMessage("Removed from list.").then(()=>{
						db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
							nlist=rows[0];
							if(!nlist){ console(`Error finding list ${args[0].toLowerCase()} after removing triggers.`) }
							if(nlist.list.replace(/,*/g,"")==""||nlist.list==undefined){
								db.query(`DELETE FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
									msg.channel.createMessage("List is empty; deleted.");
								})
							}
						})
					})
				})
			},500)

		})
	})
})


//- - - - - - - - - - Pings - - - - - - - - - -

commands.ping=bot.registerCommand("ping",["pong!","pang!","peng!","pung!"],{
	description: "Pong!",
	fullDescription: "Just a test command at the moment"
})


//- - - - - - - - - - Random - - - - - - - - - - - -

commands.random=bot.registerCommand("random",(msg,args)=>{
			var max=(isNaN(args[0]) ? 10 : args[0]);
			var num=Math.floor(Math.random() * max);
			var nums=num.toString().split("");
			var done="";
			for(var x=0;x<nums.length;x++){
				nums[x]=":"+Texts.numbers[eval(nums[x])]+":";
			}
			done=nums.join("");
			setTimeout(function(){msg.channel.createMessage("Your number:\n"+done)},500);
},{
	description: "gives a random number",
	fullDescription: "gives a random number between 0 and whatever you enter (default: 10)"
})

//- - - - - - - - - - - Prefix - - - - - - - - - -

commands.prefix=bot.registerCommand("prefix",(msg,args)=>{

	if(args[0]!=undefined && m){
		bot.registerGuildPrefix(msg.guild.id,[args[0]].concat(config.prefix));
		msg.channel.createMessage("Guild prefix updated.")
	} else {
		bot.registerGuildPrefix(msg.guild.id,"hh!")
		msg.channel.createMessage("Guild prefix reset.")
	}

},{
	description: "Sets guild prefix",
	fullDescription: "Sets prefix for the guild you're in. The defaults still work, of course."
})

//- - - - - - - - - - Eval - - - - - - - - - -
commands.evl=bot.registerCommand("eval",(msg,args)=>{
	if(!config.accepted_ids.includes(msg.author.id)){ return msg.channel.createMessage("Only the bot owner can use this command."); }

		try {
			const toeval = args.join(" ");
			let evld = eval(toeval);

			if(typeof(evld)!=="string"){
				evld=require("util").inspect(evld);
			}

			msg.channel.createMessage(Util.cleanText(evld));
		} catch (err) {
			if(err){console.log(err)}
		};


});

commands.evl.registerSubcommand("prm",(msg,args)=>{

	if(!config.accepted_ids.includes(msg.author.id)){ return msg.channel.createMessage("Only the bot owner can use this command."); }

	async function f(){

		try {
			const promeval = args.join(" ");
			let evlp = await eval(promeval);

			if(typeof(evlp)!=="string"){
				evlp=require("util").inspect(evlp);
			}

			msg.channel.createMessage(Util.cleanText(evlp));
		} catch (err) {
			if(err){console.log(err)}
		}

	}

	f();


});

//---------------------------------------------- FUN ---------------------------------------------------
//======================================================================================================
//------------------------------------------------------------------------------------------------------

//- - - - - - - - - - What's up - - - - - - - - - -
commands.whats=bot.registerCommand("whats",(msg,args)=>{
	if(!args[0]){ return }
	if(args[0].match(/up\?*/)){
		msg.channel.createMessage(Util.randomText(Texts.wass));
	}
})
bot.registerCommandAlias("what's","whats");


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
})

//- - - - - - - - - - MessageCreate - - - - - - - - - -
bot.on("messageCreate",(msg)=>{
	if(msg.content.toLowerCase()=="hey herobrine"){
		msg.channel.createMessage("That's me!");
		return;
	}

	//if(new RegExp("good\s").test(msg.content.toLowerCase()))

	if(new RegExp("^"+config.prefix.join("|")).test(msg.content.toLowerCase()) || (bot.guildPrefixes[msg.guild.id] && msg.content.toLowerCase().startsWith(bot.guildPrefixes[msg.guild.id][0]))){
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
		console.log(`Time: ${ndt} at ${now.getHours().toString().length < 2 ? "0"+ now.getHours() : now.getHours()}${now.getMinutes()}\nMessage: ${msg.content}\nUser: ${msg.author.username}#${msg.author.discriminator}\nGuild: ${msg.guild.name} (${msg.guild.id})`)
		fs.appendFile(`./logs/${ndt}.log`,`\r\nTime: ${ndt} at ${now.getHours().toString().length < 2 ? "0"+ now.getHours() : now.getHours()}${now.getMinutes()}\r\nMessage: ${msg.content}\r\nUser: ${msg.author.username}#${msg.author.discriminator}\r\nGuild: ${msg.guild.name} (${msg.guild.id})\r\n--------------------`,(err)=>{
			if(err) console.log(`Error while attempting to write log ${ndt}\n`+err);
		})
	}
})

setup();
bot.connect()
	.catch(e => console.log("Trouble connecting...\n"+e))
