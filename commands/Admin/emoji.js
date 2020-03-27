module.exports = {
	help: ()=> "Add or delete emoji",
	usage: ()=> ["- List the server's current emoji",
				 " add [name] <url> - Add an emoji with the given name. If no url is given, takes from the attached image",
				 " delete [name] - Delete an emoji with the given name"],
	execute: async (bot, msg, args) => {
		var animated = [];
		var static = [];
		var max = [50, 100, 150, 250][msg.guild.premiumTier];
		msg.guild.emojis.forEach(e => {
			if(e.animated) animated.push(e);
			else static.push(e);
		})
		msg.channel.createMessage({embed: {
			title: "Server Emoji",
			description: `Current emoji count: ${msg.guild.emojis.length}/${max * 2}\nStatic: ${static.length}/${max}\nAnimated: ${animated.length}/${max}`,
			fields: [
				{name: "**Static Emoji**", value: static.map(e => `<:${e.name}:${e.id}> \`:${e.name}:\``).join("\n")},
				{name: "**Animated Emoji**", value: animated.map(e => `<a:${e.name}:${e.id}> \`:${e.name}:\``).join("\n")}
			]
		}})
	},
	guildOnly: true,
	subcommands: {},
	module: "admin"
}

module.exports.subcommands.add = {
	help: ()=> "Add an emoji",
	usage: ()=> [" [name] - Add an emoji using the name and an attached image",
				 " [name] [url] - Add an emoji using the name and an image url",
				 " [name] [other emoji] - Add an emoji using the name and an existing emoji from another server"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a name for the emoji");
		var url;
		if(args[1]) {
			var match = args[1].match(/<a?\:(?:.*)\:([0-9]*)>/);
			console.log(match);
			if(match) url = `https://cdn.discordapp.com/emojis/${match[1]}.${args[1].startsWith("<a") ? "gif" : "png"}`;
			else url = args[1];
		} else url = msg.attachments[0] ? msg.attachments[0].url : undefined;
		if(!url) return msg.channel.createMessage("Please provide a url or attach an image");

		var resp = await bot.fetch(url);
		var img = Buffer.from(await resp.buffer());
		if(img.length > 256000) return msg.channel.createMessage("Image is too big, must be below 256kb");
		bot.fs.writeFileSync(__dirname+`/../../${msg.guild.id}.emoji`,img);
		var uri = new bot.duri(__dirname+`/../../${msg.guild.id}.emoji`);

		try {
			await msg.guild.createEmoji({name: args[0], image: uri.content});
		} catch(e) {
			console.log(e);
			return msg.channel.createMessage("ERR: "+e.message);
		}
		msg.channel.createMessage("Emoji added!");
		bot.fs.unlinkSync(__dirname+`/../../${msg.guild.id}.emoji`);
	},
	permissions: ['manageEmojis'],
	guildOnly: true,
	alias: ["create", "new"]
}

module.exports.subcommands.delete = {
	help: ()=> "Add an emoji",
	usage: ()=> [" [name] - Delete an emoji with the given name"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide an emoji to delete");
		var emoji = msg.guild.emojis.find(e => e.name.toLowerCase() == args[0].toLowerCase());
		if(!emoji) return msg.channel.createMessage("Emoji not found");
		try {
			await msg.guild.deleteEmoji(emoji.id);
		} catch(e) {
			console.log(e)
			return msg.channel.createMessage("ERR: "+e.message)
		}
		msg.channel.createMessage("Emoji deleted!")
	},
	permissions: ['manageEmojis'],
	guildOnly: true,
	alias: ["remove"]
}