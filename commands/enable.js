var Util = require("../utilities");

module.exports = {
	help: ()=> "Disables a command/module or a command's subcommands.",
	usage: ()=> [" [command/module] <subcommand> - disables given command or its subcommand",
				" list - lists disabled commands"],
	execute: (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a command/module to disable.");
		var label = args[0].toLowerCase();
		var lb;
		if(bot.commands[label] || Object.values(bot.commands).find(x => x.alias && x.alias.includes(label))){
			lb = {name:
				Object.keys(bot.commands).find(x => bot.commands[x].alias && bot.commands[x].alias.includes(label)) || label, type: "command"};
				lb.cmd = bot.commands[lb.name];
			if(args[1] && bot.commands[lb.name].subcommands && (bot.commands[lb.name].subcommands[args[1].toLowerCase()] || Object.values(bot.commands[lb.name].subcommands).find(x => x.alias && x.alias.includes(args[1].toLowerCase())))){
				var toenable = {name: Object.keys(bot.commands[lb.name].subcommands).find(x => bot.commands[lb.name].subcommands[x].alias && bot.commands[lb.name].subcommands[x].alias.includes(args[1].toLowerCase())) || args[1].toLowerCase()};
				toenable.cmd = bot.commands[lb.name].subcommands[toenable.name];
				console.log(toenable);
			} else if(args[1]){
				var toenable = "notfound";
				console.log("toenable not found");
			} else {
				var toenable = "empty";
			}
		} else if(bot.modules[label]){
			lb = {name: label, type: "module", cmd: {module: label}};

		} else {
			lb = "";
		}

		if(!lb.name) return msg.channel.createMessage("Command/module not found.");
		if(toenable == "notfound") return msg.channel.createMessage("Subcommand not found.")
		if(!Util.checkDisabled(bot, msg.guild.id, [lb, (toenable == "empty" ? "" : toenable)])){
			console.log("Check disabled returned false");
			return msg.channel.createMessage(lb.type.charAt(0).toUpperCase() + lb.type.slice(1) + " already enabled.");
		}
		bot.db.query(`SELECT * FROM configs WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
			if(rows[0]){
				var dis = JSON.parse(rows[0].disabled);
				if(lb.type == "module"){
					if(!dis.modules){
						msg.channel.createMessage("Module already enabled.");
					} else if(!dis.modules.includes(lb.name)){
						msg.channel.createMessage("Module already enabled.");
					} else {
						dis.modules.splice(dis.modules.indexOf(lb.name),1);
						msg.channel.createMessage("Module enabled.");
					}
				} else if(lb.type == "command") {
					if(!dis.commands){
						msg.channel.createMessage("Command already enabled.")
					} else if(dis.commands[lb.name]){
						if(dis.commands[lb.name].includes("all") && toenable == "empty"){
							delete dis.commands[lb.name];
							msg.channel.createMessage("Command enabled.");
						} else if(toenable!= "empty" && dis.commands[lb.name].includes(toenable.name)){
							dis.commands[lb.name].splice(dis.commands[lb.name].indexOf(toenable.name),1)
							msg.channel.createMessage("Command enabled.");
						} else if(toenable!="empty"){
							msg.channel.createMessage("Command already enabled.");
						}
					} else {
						msg.channel.createMessage("Command already enabled.");
					}
				}
				bot.db.query(`UPDATE configs SET disabled=? WHERE srv_id='${msg.guild.id}'`,[dis],(err,rows)=>{
					if(err) return console.log("There was an error updating disabled commands.");
					Util.reloadConfig(bot, msg.guild.id);
				})
			} else {
				msg.channel.createMessage("Something went wrong.");
				Util.reloadConfig(bot, msg.guild.id);
			}
			
		})
	},
	guildOnly: true,
	module: "admin",
	permissions: ["manageGuild"]
}