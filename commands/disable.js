var Util = require("../utilities");

module.exports = {
	help: ()=> "Disables a command/module or a command's subcommands.",
	usage: ()=> [" [command/module] <subcommand> - disables given command or its subcommand",
				" list - lists disabled commands"],
	execute: (bot, msg, args) => {
		// var todisable;
		if(!args[0]) return msg.channel.createMessage("Please provide a command/module to disable.");
		var label = args[0].toLowerCase();
		var lb;
		if(args[0] == "disable"){
			msg.channel.createMessage("You can't disable this command.");
		} else if(bot.commands[label] || Object.values(bot.commands).find(x => x.alias && x.alias.includes(label))){
			lb = {name:
				Object.keys(bot.commands).find(x => bot.commands[x].alias && bot.commands[x].alias.includes(label)) || label, type: "command"};
				lb.cmd = bot.commands[lb.name];
			if(args[1] && bot.commands[lb.name].subcommands && (bot.commands[lb.name].subcommands[args[1].toLowerCase()] || Object.values(bot.commands[lb.name].subcommands).find(x => x.alias && x.alias.includes(args[1].toLowerCase())))){
				var todisable = {name: Object.keys(bot.commands[lb.name].subcommands).find(x => bot.commands[lb.name].subcommands[x].alias && bot.commands[lb.name].subcommands[x].alias.includes(args[1].toLowerCase())) || args[1].toLowerCase()};
				todisable.cmd = bot.commands[lb.name].subcommands[todisable.name];
				console.log(todisable);
			} else if(args[1]){
				var todisable = "notfound";
				console.log("todisable not found");
			} else {
				var todisable = "empty";
			}
		} else if(bot.modules[label]){
			lb = {name: label, type: "module", cmd: {module: label}};

		} else {
			lb = "";
		}

		if(!lb.name) return msg.channel.createMessage("Command/module not found.");
		if(todisable == "notfound") return msg.channel.createMessage("Subcommand not found.")
		if(Util.checkDisabled(bot, msg.guild.id, [lb, (todisable == "empty" ? "" : todisable)])){
			console.log("Check disabled returned true");
			return msg.channel.createMessage(lb.type.charAt(0).toUpperCase() + lb.type.slice(1) + " already disabled.");
		}
		bot.db.query(`SELECT * FROM configs WHERE srv_id='${msg.guild.id}'`,(err,rows)=>{
			if(rows[0]){
				var dis = JSON.parse(rows[0].disabled);
				if(lb.type == "module"){
					if(!dis.modules){
						dis.modules = [lb.name];
						msg.channel.createMessage("Module disabled.")
					} else if(!dis.modules.includes(lb.name)){
						dis.modules.push(lb.name);
						msg.channel.createMessage("Module disabled.")
					} else {
						msg.channel.createMessage("Module already disabled.");
					}
				} else if(lb.type == "command") {
					if(!dis.commands){
						if(todisable == "empty"){
							dis.commands = {};
							dis.commands[lb.name] = [];
							dis.commands[lb.name].push("all");
							msg.channel.createMessage("Command disabled.")
						} else {
							dis.commands = {};
							dis.commands[lb.name] = [todisable.name];
							msg.channel.createMessage("Command disabled.")
						}
					} else if(dis.commands[lb.name]){
						if(dis.commands[lb.name].includes("all")){
							msg.channel.createMessage("Command already disabled.");
						} else if(todisable!= "empty" && dis.commands[lb.name].includes(todisable.name)){
							msg.channel.createMessage("Command already disabled.");
						} else if(todisable!="empty"){
							dis.commands[lb.name].push(todisable.name);
							msg.channel.createMessage("Command disabled.");
						}
					} else {
						if(todisable != "empty"){
							dis.commands[lb.name] = [];
							dis.commands[lb.name].push(todisable.name)
							msg.channel.createMessage("Command disabled.");
						} else if(todisable == "empty"){
							dis.commands[lb.name] = ["all"];
							msg.channel.createMessage("Command disabled.");
						} else {
							msg.channel.createMessage("Subcommand not found.");
						}
					}
				}
				if(lb.type == "module") console.log(dis);
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