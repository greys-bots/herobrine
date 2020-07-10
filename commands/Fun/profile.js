module.exports = {
	help: ()=> "Shows your profile",
	usage: ()=> [" - Views your profile",
				" [member ID/mention] - views another user's profile",
				" edit - opens a menu for profile editing",
				" enable/disable - enables/disables level-up messages"],
	execute: async (bot, msg, args)=>{
		if(args[0] && !msg.guild) return "You can only view others' profiles in guilds.";
		var id = args[0] ? args[0].replace(/[<@!>]/g,"") : msg.author.id;
		var member = msg.guild ? msg.guild.members.find(m => m.id == id) : msg.author;
		var profile = await bot.stores.profiles.get(id);

		if(!profile) return "Profile not found.";

		return {embed:{
			title: profile.title,
			description: profile.bio,
			fields: [
				{name: "Level", value: profile.lvl, inline: true},
				{name: "EXP", value: profile.exp, inline: true},
				{name: "Cash", value: profile.cash}
			],
			color: parseInt(profile.color, 16) || parseInt("aaaaaa", 16),
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
		}}
	},
	alias: ["p","prof"],
	subcommands: {},
	module: "utility"
}

module.exports.subcommands.disable = {
	help: ()=> "Disables level up messages.",
	usage: ()=> [" - disables level up messages"],
	execute: async (bot, msg, args)=>{
		var profile = await bot.stores.profiles.get(msg.author.id);
		if(!profile) return "Couldn't get your profile, please try again.";

		if(profile.disabled) return "Level-up messages are already disabled.";

		try {
			await bot.stores.profiles.update(msg.author.id, {disabled: true});
		} catch(e) {
			return "ERR: "+e;
		}
		
		return "Level-up messages disabled!";
	}
}

module.exports.subcommands.enable = {
	help: ()=> "Enables level up messages.",
	usage: ()=> [" - enables level up messages"],
	execute: async (bot, msg, args)=>{
		var profile = await bot.stores.profiles.get(msg.author.id);
		if(!profile) return "Couldn't get your profile, please try again.";

		if(!profile.disabled) return "Level-up messages are already enabled.";

		try {
			await bot.stores.profiles.update(msg.author.id, {disabled: false});
		} catch(e) {
			return "ERR: "+e;
		}
		
		return "Level-up messages enabled!";
	}
}

module.exports.subcommands.edit = {
	help: ()=> "Runs a menu for editing profiles.",
	usage: ()=> [" - opens an edit menu",
				" [bio/title/color] [new value] - quick edit method for your bio/title/color"],
	execute: async (bot, msg, args)=>{
		var profile = await bot.stores.profiles.get(msg.author.id);
		if(!profile) return "Couldn't get your profile, please try again.";

		var prop;
		if(!args[0]) {
			var resp;
			msg.channel.createMessage("```\nWhat do you want to edit? (Choose a number)\n\n[1] Title\n[2] Bio\n[3] Color\n[4] Cancel\n```");
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 10000, maxMatches: 1});
			if(resp[0].content == 4) return "Action cancelled.";
			prop = ["title", "bio", "color"][parseInt(resp[0].content) - 1];
			if(!prop) return "ERR: invalid choice. Aborting.";
		} else {
			prop = args[0].toLowerCase();
			if(!["bio", "title","color"].includes(prop)) return "That prop is invalid. Options: `bio`, `title`, or `color`";
		}

		var val = args.slice(1).join(" ");
		if(!val) {
			msg.channel.createMessage(`Enter a new value for your ${prop}.`);
			resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {time: 10000, maxMatches: 1});
			val = resp[0].content;
		}

		if(prop == "color") {
			var color = bot.tc(val);
			if(!color.isValid()) return "ERR: color is invalid. Aborting.";
			val = color.toHex()
		}

		var dat = {};
		dat[prop] = val;

		try {
			await bot.stores.profiles.update(msg.author.id, dat);
		} catch(e) {
			return "ERR: "+e;
		}
		
		return "Profile updated!";
	}
}
