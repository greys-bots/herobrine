var config = require('../config.json');
var exec = require("child_process").exec;

module.exports = {
	help: ()=> "Reloads entire bot.",
	usage: ()=> [" - reloads Herobrine"],
	execute: (bot, msg, args)=>{
		if(config.update){
			if(config.accepted_ids.includes(msg.author.id) && config.branch && config.remote){
				var git = exec(`git pull ${config.remote} ${config.branch}`,{cwd: __dirname}, (err, out, stderr)=>{
					if(err){
						console.error(err);
						console.log(config.accepted_ids);
						bot.users.find(u => u.id == config.accepted_ids[0]).getDMChannel().then((ch)=>{
							ch.sendMessage("Error pulling files.")
						})
						return;
					}
					console.log(out);
					if(out.toString().includes("up to date")){
						return console.log("Everything up to date.");
					}

					var gp = exec(`git fetch --all && git reset --hard ${config.remote}/${config.branch}`, {cwd: __dirname}, (err2, out2, stderr2)=>{
						if(err2){
							console.error(err2);
							bot.users.find(u => u.id == config.accepted_ids[0]).getDMChannel().then((ch)=>{
								ch.sendMessage("Error overwriting files.")
							})
							return;
						}
						console.log("fetched and updated. output: "+out2)
					})
				})
			} else {
				msg.channel.createMessage("Only the bot creator can do that.")
			}
		} else {
			msg.channel.createMessage("Updates are disabled. Turn them on and supply a remote and branch in order to use this command.")
		}
	}
}
