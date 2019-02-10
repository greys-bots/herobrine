const Util = require("../utilities.js");
const Texts = require("../strings.json");

module.exports= {
		help: () => "List, register, add, and remove triggers.",
		usage: () => [" - List your trigger lists, if you have any.",
						" [code] - List triggers registered at that code.",
						" new - Creates a new list, using a handy menu.",
						" add [code] <triggers, to, add> - Adds triggers to a list. If no triggers are given, runs a menu.",
						" remove [code] <triggers, to, remove> - Removes triggers from a list. If no triggers are given, runs a menu.",
						" delete [code] - Deletes a trigger list."],
		execute: (bot, msg, args) => {
			if(args[0]){
				let code = args.shift().toLowerCase();
				bot.db.query(`SELECT * FROM triggers WHERE code='${code}'`,(err,rows)=>{
					var list=rows[0];
					if(list){
						msg.channel.createMessage({embed:{
							title:"Triggers for "+list.alias,
							description: list.list.split(/,\s*/).join("\n"),
							color: 11433333
						}})
					} else {
						msg.channel.createMessage("That list wasn't found.");
					}
				});
			} else {
				bot.db.query(`SELECT * FROM triggers WHERE user_id='${msg.author.id}'`,(err,rows)=>{
					if(err){
						console.log(err)
					} else {
						msg.channel.createMessage({embed:{
							title:"triggers - (alias: code)",
							description: (rows.map(t=>t.alias+": "+t.code).length > 0 ? rows.map(t=>t.alias+": "+t.code).join("\n") : "None found.")
						}})
					}
				})
			}
		},
		module: "utility",
		subcommands: []
	}

module.exports.subcommands.new = {
	help: ()=> "Creates a new trigger list.",
	usage: ()=> [" - Opens a menu for creating a new list"],
	execute: (bot, msg, args)=>{
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
							bot.db.query(`INSERT INTO triggers VALUES (?,?,?,?)`,[msg.author.id,cd,trigs_received[0].content,listname],(err,rows)=>{
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
	}
}
module.exports.subcommands.add = {
	help: ()=> "Add new triggers.",
	usage: ()=> [" <stuff, to, add> - Adds new triggers. Uses a menu if no triggers are given in the command."],
	execute: (bot, msg, args)=>{
		if(!args[0]) return msg.channel.createMessage("Please provide a list to add to.");
		bot.db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
			tl = rows[0];
			if(!tl){ return msg.channel.createMessage("List does not exist."); }
			if(!(tl.user_id == msg.author.id)){ return msg.channel.createMessage("That list doesn't belong to you.");}
			if(args.length > 1){
				bot.db.query(`UPDATE triggers SET list='${tl.list},${args.slice(1).join(" ")}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
					msg.channel.createMessage("Appended to list.");
				})
				return;
			}
			msg.channel.createMessage("Write what you want to add.");
			msg.channel.awaitMessages(m=> m.author.id == msg.author.id,{time:60000,maxMatches:1}).then(resp=>{
				bot.db.query(`UPDATE triggers SET list='${tl.list},${resp[0].content}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
					msg.channel.createMessage("Appended to list.")
				})
			})
		})
	}
}
module.exports.subcommands.remove = {
	help: ()=> "Remove existing triggers.",
	usage: ()=> [" <stuff, to, remove> - Removes triggers from a list. Runs a menu if triggers aren't specified."],
	execute: (bot, msg, args)=>{
		if(!args[0]) return msg.channel.createMessage("Please provide a list to remove from.");
		bot.db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
			tl = rows[0];
			if(!tl){ return msg.channel.createMessage("List does not exist."); }
			if(!(tl.user_id == msg.author.id)){ return msg.channel.createMessage("That list doesn't belong to you.");}
			var tlist = tl.list.split(/,\s*/);
			if(args.length > 1){
				var rmlist = args.slice(1).join(" ");
				console.log(rmlist);
				rmlist = rmlist.split(/,\s*/);
				tlist = tlist.filter((t,ind)=>{
					var f = true;
					for(var i = 0; i < rmlist.length; i++){
						if(t == rmlist[i]){
							f = false;
						}
					}
					return f;
				})
				bot.db.query(`UPDATE triggers SET list='${tlist}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
					msg.channel.createMessage("Removed from list.").then(()=>{
						bot.db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
							nlist=rows[0];
							if(!nlist){ console(`Error finding list ${args[0].toLowerCase()} after removing triggers.`) }
							if(nlist.list.replace(/,*/g,"")==""||nlist.list==undefined){
								bot.db.query(`DELETE FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
									msg.channel.createMessage("List is empty; deleted.");
								})
							}
						})
					})
				})
				return;
			}
			msg.channel.createMessage("Write what you want to remove.");
			msg.channel.awaitMessages(m=> m.author.id == msg.author.id,{time:60000,maxMatches:1}).then(resp=>{
				var rmlist = resp[0].content.split(/,\s*/);
				tlist = tlist.filter((t,ind)=>{
					var f = true;
					for(var i = 0; i < rmlist.length; i++){
						if(t == rmlist[i]){
							f = false;
						}
					}
					return f;
				})
				setTimeout(function(){
					bot.db.query(`UPDATE triggers SET list='${tlist}' WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
						msg.channel.createMessage("Removed from list.").then(()=>{
							bot.db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
								nlist=rows[0];
								if(!nlist){ console(`Error finding list ${args[0].toLowerCase()} after removing triggers.`) }
								if(nlist.list.replace(/,*/g,"")==""||nlist.list==undefined){
									bot.db.query(`DELETE FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
										msg.channel.createMessage("List is empty; deleted.");
									})
								}
							})
						})
					})
				},500)

			})
		})
	}
}
module.exports.subcommands.delete = {
	help: ()=> "Delete a trigger list.",
	usage: ()=> [" [code] - Delete a trigger list with code [code]."],
	execute: (bot, msg, args)=>{
		if(!args[0]) return msg.channel.createMessage("Please provide a list to remove from.");
		bot.db.query(`SELECT * FROM triggers WHERE code='${args[0].toLowerCase()}'`,(err,rows)=>{
			tg=rows[0];
			if(!tg){ return msg.channel.createMessage("That list doesn't exist."); }
			if(!(tg.user_id == msg.author.id)){ return msg.channel.createMessage("That list does't belong to you.")}
			msg.channel.createMessage(`Are you sure you want to delete this set? Enter \`${tg.code}\` to delete it.`)
			msg.channel.awaitMessages(m=> m.author.id == msg.author.id,{time:10000,maxMatches:1}).then(resp=>{
				if(resp[0].content.toLowerCase() == tg.code){
					bot.db.query(`DELETE FROM triggers WHERE code='${tg.code}'`,(err,rows)=>{
						if(err) console.log(err);
						else msg.channel.createMessage("Deleted.");
					})
				}
			})
		})
	}
}