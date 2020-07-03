module.exports = {
	help: ()=> "Reloads entire bot.",
	usage: ()=> [" - Reloads Herobrine"],
	execute: (bot, msg, args)=>{
		if(!bot.cfg.update) return "Updates are disabled. Turn them on and supply a remote and branch in order to use this command.";
		if(!bot.cfg.accepted_ids.includes(msg.author.id)) return "Only the bot owner can use this command.";
		if(!bot.cfg.branch || !bot.cfg.remote) return "Please provide a remote and branch in the config.";

		
		var git = exec(`git pull ${bot.cfg.remote} ${bot.cfg.branch}`,{cwd: __dirname}, (err, out, stderr)=>{
			if(err){
				console.error(err);
				bot.users.find(u => u.id == bot.cfg.accepted_ids[0]).getDMChannel().then((ch)=>{
					ch.sendMessage("Error pulling files.")
				})
				return;
			}
			console.log(out);
			if(out.toString().includes("up to date")){
				return console.log("Everything up to date.");
			}

			var gp = exec(`git fetch --all && git reset --hard ${bot.cfg.remote}/${bot.cfg.branch}`, {cwd: __dirname}, (err2, out2, stderr2)=>{
				if(err2){
					console.error(err2);
					bot.users.find(u => u.id == bot.cfg.accepted_ids[0]).getDMChannel().then((ch)=>{
						ch.sendMessage("Error overwriting files.")
					})
					return;
				}
				console.log("fetched and updated. output: "+out2)
			})
		})
	},
	module: "owner"
}