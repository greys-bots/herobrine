const tinycolor = require("tinycolor2");

module.exports = {
	help: ()=> "View and customize your profile",
	usage: ()=> ["- Views your profile",
				 "[id | mention] - Views another user's profile",
				 "name [new name] - Sets your profile's name",
				 "description [new description] - Sets your profile's description",
				 "color [new color] - Sets your profile's color",
				 "disable - Disables level-up messages",
				 "enable - Enables level-up messages",
				 "delete - Deletes your profile"],
	execute: async (bot, msg, args) => {
		var id = (args[0] ? args[0].replace(/[<@!>]/g, "") : msg.author.id);
		var profile = await bot.stores.profiles.get(id);
		if(!profile) return "No profile found";
		var user;
		try {
			if(args[0]) user = await bot.users.fetch(id);
			else user = msg.author;
		} catch(e) {
			return "ERR: " + e.message;
		}
		
		return {
			title: profile.name || "untitled user profile",
			description: profile.description || "(not set)",
			author: {
				name: user.tag,
				icon_url: user.avatarURL({format: "png", dynamic: true})
			},
			color: parseInt(profile.color, 16) || parseInt("aaaaaa", 16),
			fields: [
				{name: "Level", value: (profile.level).toString(), inline: true},
				{name: "Experience", value: (profile.exp).toString(), inline: true}
			],
			footer: {
				text: `Level-up messages ${profile.disabled ? "are" : "are not"} disabled for this user`
			}
		}
	},
	alias: ["prof"],
	subcommands: {}
}

module.exports.subcommands.name = {
	help: ()=> "Set your profile's name",
	usage: ()=> ["[new name] - Sets profile's name to the given value"],
	execute: async (bot, msg, args) => {
		var profile = await bot.stores.profiles.get(msg.author.id);
		var name = args.join(" ");
		if(name.length > 100) return "Name too long, must be 100 characters or less";

		try {
			profile.name = name;
			await profile.save();
		} catch(e) {
			return "ERR: "+e;
		}

		return "Name set!";
	}
}

module.exports.subcommands.description = {
	help: ()=> "Set your profile's description",
	usage: ()=> ["[new description] - Sets profile's description to the given value"],
	execute: async (bot, msg, args) => {
		var profile = await bot.stores.profiles.get(msg.author.id);
		var desc = args.join(" ");
		if(desc.length > 250) return "Description too long, must be 250 characters or less";
		
		try {
			profile.description = desc;
			await profile.save();
		} catch(e) {
			return "ERR: "+e;
		}

		return "Description set!";
	},
	alias: ["desc"]
}

module.exports.subcommands.color = {
	help: ()=> "Set your profile's color",
	usage: ()=> ["[new color] - Sets profile's color to the given value"],
	execute: async (bot, msg, args) => {
		var profile = await bot.stores.profiles.get(msg.author.id);

		var color = tinycolor(args.join(""));
		if(!color.isValid()) return "That color isn't valid";

		try {
			profile.color = color.toHex();
			await profile.save();
		} catch(e) {
			return "ERR: "+e;
		}

		return "Color set!";
	},
	alias: ["colour"]
}

module.exports.subcommands.enable = {
	help: ()=> "Enable level-up messages for your account",
	usage: ()=> ["- Enables level-up messages"],
	execute: async (bot, msg, args) => {
		var profile = await bot.stores.profiles.get(msg.author.id);

		if(!profile.disabled) return "Level-up messages are already enabled!";

		try {
			profile.disabled = false;
			await profile.save();
		} catch(e) {
			return "ERR: "+e;
		}

		return "Level-ups enabled!";
	}
}

module.exports.subcommands.disable = {
	help: ()=> "Disable level-up messages for your account",
	usage: ()=> ["- Disables level-up messages"],
	execute: async (bot, msg, args) => {
		var profile = await bot.stores.profiles.get(msg.author.id);

		if(profile.disabled) return "Level-up messages are already disabled!";

		try {
			profile.disabled = true;
			await profile.save();
		} catch(e) {
			return "ERR: "+e;
		}

		return "Level-ups disabled!";
	}
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes your profile",
	usage: ()=> ["- Deletes your profile from the bot, including all levels/experience/etc"],
	execute: async (bot, msg, args) => {
		var message = await msg.channel.send("Are you sure you want to do this? You'll lose any data saved in your profile currently");
		["✅","❌"].forEach(r => message.react(r));

		var response = await message.awaitReactions((r, u) => u.id == msg.author.id, {time: 60000, max: 1});
		if(!response || !response.first()) return "ERR: Timed out. Action cancelled";
		response = response.first();
		if(response.emoji.name == "✅") {
			try {
				await bot.stores.profiles.delete(msg.author.id);
				await message.reactions.removeAll();
			} catch(e) {
				console.log(e);
				return "ERR: "+e;
			}
			return "Profile deleted!";
		} else return "Action cancelled";
	}
}