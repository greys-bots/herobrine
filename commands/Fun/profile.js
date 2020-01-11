module.exports = {
	help: ()=> "Shows your profile",
	usage: ()=> [" - Views your profile",
				" [member ID/mention] - views another user's profile",
				" edit - opens a menu for profile editing",
				" enable/disable - enables/disables level-up messages"],
	execute: async (bot, msg, args)=>{
		if(args[0] && !msg.guild) return msg.channel.createMessage("You can only view others' profiles in guilds");
		var id = args[0] ? args[0].replace(/[<@!>]/g,"") : msg.author.id;
		var member = msg.guild ? msg.guild.members.find(m => m.id == id) : msg.author;
		var profile = await bot.utils.getProfile(bot, id);

		if(!profile) return msg.channel.createMessage("Profile not found");

		msg.channel.createMessage({embed:{
			title: profile.title,
			description: profile.bio,
			fields: [
				{name: "Level", value: profile.lvl, inline: true},
				{name: "EXP", value: profile.exp, inline: true},
				{name: "Cash", value: profile.cash}
			],
			color: profile.color || parseInt("aaaaaa", 16),
			author: {
				name: member.username,
				icon_url: member.avatarURL
			},
			thumbnail: {
				url: member.avatarURL
			},
			footer: {
				text: `Level up messages ${profile.disabled ? "are" : "are not"} disabled for this user`
			}
		}})
	},
	alias: ["p","prof"],
	subcommands: {},
	module: "utility"
}

module.exports.subcommands.disable = {
	help: ()=> "Disables level up messages.",
	usage: ()=> [" - disables level up messages"],
	execute: async (bot, msg, args)=>{
		var profile = await bot.utils.getProfile(bot, msg.author.id);
		if(!profile) return msg.channel.createMessage("Couldn't get your profile, please try again");

		if(profile.disabled) return msg.channel.createMessage("Already disabled");

		var scc = await bot.utils.updateProfile(bot, msg.author.id, "disabled", true);
		if(!scc) msg.channel.createMessage("Something went wrong");
		else msg.channel.createMessage("Level-up messages disabled");
	}
}

module.exports.subcommands.enable = {
	help: ()=> "Enables level up messages.",
	usage: ()=> [" - enables level up messages"],
	execute: async (bot, msg, args)=>{
		var profile = await bot.utils.getProfile(bot, msg.author.id);
		if(!profile) return msg.channel.createMessage("Couldn't get your profile, please try again");

		if(!profile.disabled) return msg.channel.createMessage("Already enabled");

		var scc = await bot.utils.updateProfile(bot, msg.author.id, "disabled", false);
		if(scc) msg.channel.createMessage("Level-up messages enabled");
		else msg.channel.createMessage("Something went wrong");
	}
}

module.exports.subcommands.edit = {
	help: ()=> "Runs a menu for editing profiles.",
	usage: ()=> [" - opens an edit menu",
				" [bio/title/color] [new value] - quick edit method for your bio/title/color"],
	execute: async (bot, msg, args)=>{
		var profile = await bot.utils.getProfile(bot, msg.author.id);
		if(!profile) return msg.channel.createMessage("Couldn't get your profile, please try again");

		switch(args[0]){
			case "bio":
				var b = (args[1] ? args.slice(1).join(" ") : "Beep Boop!");
				var scc = await bot.utils.updateProfile(bot, msg.author.id, "bio", b);
				if(scc) msg.channel.createMessage("Profile updated");
				else msg.channel.createMessage("Something went wrong");
				break;
			case "title":
				var t = (args[1] ? args.slice(1).join(" ") : "Title Here");
				var scc = await bot.utils.updateProfile(bot, msg.author.id, "title", t);
				if(scc) msg.channel.createMessage("Profile updated");
				else msg.channel.createMessage("Something went wrong");
				break;
			case "color":
				var c = (args[1] ? parseInt(args[1].replace("#",""),16) : 0);
				var scc = await bot.utils.updateProfile(bot, msg.author.id, "color", c);
				if(scc) msg.channel.createMessage("Profile updated");
				else msg.channel.createMessage("Something went wrong");
				break;
			default:
				var resp;
				msg.channel.createMessage("```\nWhat do you want to edit? (Choose a number)\n\n[1] Title\n[2] Bio\n[3] Color\n[4] Cancel\n```");
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 10000, maxMatches: 1})
				if(resp[0]) {
					switch(resp[0].content){
						case "1":
							msg.channel.createMessage("Write what you want the new title to be.");
							resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time: 20000, maxMatches: 1});
							if(resp[0]){
								profile.title = resp[0].content;
								var scc = await bot.utils.updateProfile(bot, msg.author.id, "title", profile.title);
								if(scc) msg.channel.createMessage("Profile updated");
								else msg.channel.createMessage("Something went wrong");
							} else {
								msg.channel.createMessage("Action cancelled.")
							}
							break;
						case "2":
							msg.channel.createMessage("Write what you want the new bio to be.");
							resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time: 20000, maxMatches: 1});
							if(resp[0]){
								profile.bio = resp[0].content;
								var scc = await bot.utils.updateProfile(bot, msg.author.id, "bio", profile.bio);
								if(scc) msg.channel.createMessage("Profile updated");
								else msg.channel.createMessage("Something went wrong");
							} else {
								msg.channel.createMessage("Action cancelled.")
							}
							break;
						case "3":
							msg.channel.createMessage("Write what you want the new color to be.");
							resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id,{time: 20000, maxMatches: 1});
							if(resp[0]){
								profile.color = parseInt(resp[0].content.replace("#",""), 16);
								var scc = await bot.utils.updateProfile(bot, msg.author.id, "color", profile.color);
								if(scc) msg.channel.createMessage("Profile updated");
								else msg.channel.createMessage("Something went wrong");
							} else {
								msg.channel.createMessage("Action cancelled.")
							}
							break;
						default:
							msg.channel.createMessage("Action cancelled.")
							break;
					}
				}
				break;
		}
	}
}
