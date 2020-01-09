module.exports = {
	help: ()=> "Rate things!",
	usage: ()=> [" - Lists all the things I currently rate",
				 " coolness [thing to rate] - Returns a coolness rating for the given thing",
				 " babyscale [thing to rate] - Returns a rating of whether the given thing is creacher or baby"],
	desc: ()=> "*Special thanks to our friends for suggesting this <3*",
	execute: async (bot, msg, args) => {
		msg.channel.createMessage({embed: {
			title: "Current Rating Scales",
			fields: [
				{name: "Coolness Factor", value: "How chilly are you?"},
				{name: "Creacher/Baby Scale", value: "Are you creacher or baby?"}
			],
			color: parseInt("55aa55", 16),
			footer: {
				text: "Use `hh!help rate` to see all rating subcommands",
				icon_url: bot.user.avatarURL
			}
		}})
	},
	alias: ["rateme", "r8"],
	module: "fun",
	subcommands: {}
}

module.exports.subcommands.coolness = {
	help: ()=> "Rate how cool something is",
	usage: ()=> [" [thing to rate] - Returns the thing's coolness rating :sunglasses:"],
	execute: async (bot, msg, args) => {
		var target;
		var rating;
		var me = msg.guild.members.find(m => m.id == bot.user.id);
		var thing = args[0] ? args.join(" ").toLowerCase() : msg.author.id;
		var user = msg.guild.members.find(m => [`${m.username.toLowerCase()}#${m.discriminator}`, m.username.toLowerCase(), m.id].includes(thing.replace(/[<@!>]/g,'')) || (m.nickname && m.nickname.toLowerCase() == thing));
		if(!user) {
			if([`${msg.author.username.toLowerCase()}#${msg.author.discriminator}`, msg.author.username.toLowerCase(), msg.author.id, "me", "i"].includes(thing.replace(/[<@!>]/g,'')) ||
				(msg.member.nickname && msg.member.nickname.toLowerCase() == thing)) target = "**You** are";
			else if(["herobrine", "you", bot.user.id, `${bot.user.username.toLowerCase()}#${bot.user.discriminator}`].includes(thing.replace(/[<@!>]/g,'')) ||
				(me.nickname && me.nickname.toLowerCase() == thing)) target = "**I** am";
			else if(["alex", "sheep", "tg", "ticket golem", "golem"].includes(thing)) target = "**My friends** are all";
			else target = `**${thing}** is`;
		} else target = `**${user.username}#${user.discriminator}** is`

		if(target == "**I** am") rating = "absolutely frozen :sunglasses:";
		else if(target == "**My friends** are all") return "100% frosty :sunglasses:";
		else rating = Math.floor(Math.random()*2) == 1 ? Math.ceil(Math.random()*100)+"% cool!" : bot.utils.randomText(bot.strings.coolness);

		msg.channel.createMessage(`${target} **${rating}**`);
	},
	alias: ["cool", "coolness", "cs", "coolscale", "coolnesscale"]
}

module.exports.subcommands.babyscale = {
	help: ()=> "Rate things on a scale of creacher to baby!",
	usage: ()=> " [thing to rate] - Returns a rating on whether the given thing is a creacher or baby",
	execute: async (bot, msg, args) => {
		var target;
		var rating;
		var me = msg.guild.members.find(m => m.id == bot.user.id);
		var thing = args[0] ? args.join(" ").toLowerCase() : msg.author.id;
		var user = msg.guild.members.find(m => [`${m.username.toLowerCase()}#${m.discriminator}`, m.username.toLowerCase(), m.id].includes(thing.replace(/[<@!>]/g,'')) || (m.nickname && m.nickname.toLowerCase() == thing));
		if(!user) {
			if([`${msg.author.username.toLowerCase()}#${msg.author.discriminator}`, msg.author.username.toLowerCase(), msg.author.id, "me", "i"].includes(thing.replace(/[<@!>]/g,'')) ||
				(msg.member.nickname && msg.member.nickname.toLowerCase() == thing)) target = "**You** are";
			else if(["herobrine", "you", bot.user.id, `${bot.user.username.toLowerCase()}#${bot.user.discriminator}`].includes(thing.replace(/[<@!>]/g,'')) ||
				(me.nickname && me.nickname.toLowerCase() == thing)) target = "**I** am";
			else if(["alex", "sheep", "tg", "ticket golem", "golem"].includes(thing)) target = "**My friends** are all";
			else target = `**${thing}** is`;
		} else target = `**${user.username}#${user.discriminator}** is`

		if(target == "**I** am") rating = "baby creacher";
		else if(target == "**My friends** are all") return "baby creacher";
		else rating = Math.floor(Math.random()*2) == 1 ? "baby" : "creacher";

		msg.channel.createMessage(`${target} **${rating}**!`);
	},
	alias: ["bs", "baby", "babscale", "creacherscale", "creacher", "creecher", "creecherscale"]
}