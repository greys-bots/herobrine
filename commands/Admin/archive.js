module.exports = {
	help: ()=> "Archives messages in a given channel and DMs you a text file containing them.",
	usage: ()=> [" <number> - archives [number] messages, or 100 by default"],
	execute: async (bot, msg, args)=> {
		var msgs = await msg.channel.getMessages((args[0] == NaN ? 100 : args[0]))
		var data = [];
		var attachments = {};
		if(args[1] && !msg.mentions[0]) {
			if(bot.users.find(u => u.id == args[1])) {
				var memb = bot.users.find(u => u.id == args[1])
				msgs = msgs.filter(x => x.author.id == memb.id)
			} else {
				return "Can't find that user";
			}
		} else if(msg.mentions[0]) {
			msgs = msgs.filter(x => x.author.id == msg.mentions[0].id);
		} else if(args[1] && args[1].toLowerCase() == "self") {
			msgs = msgs.filter(x => x.author.id == msg.author.id);
		}

		for(var m of msgs) {
			var date = new Date(m.timestamp);
			data.push([`ID: ${m.id}`,
						`\r\n${m.author.username}#${m.author.discriminator + (m.author.bot ? " BOT" : "")} (${m.author.id})`,
						` | ${date.getMonth()+1}.${date.getDate()}.${date.getFullYear()}`,
						` at ${date.getHours()}:${date.getMinutes()}`,
						`\r\n${m.content}`].join(""));
			if (m.attachments[0]) {
				attachments[m.id] = {content: `Attachments for Message ID ${m.id}`, files: []};
				for(var f of m.attachments) {
					var att = await bot.fetch(f.url);
					attachments[m.id].files.push({file: Buffer.from(await att.buffer()), name: f.filename});
				}
			}
		}

		try {
			var c = await msg.author.getDMChannel();
			await c.createMessage("Here is the archive: ",{file: Buffer.from(data.reverse().join("\r\n------\r\n")), name: msg.channel.name+".txt"});
			if(Object.keys(attachments)[0]) {
				await c.createMessage("**Attachments incoming:**");
				for(var f of Object.keys(attachments)) await bot.createMessage(c.id, attachments[f].content, attachments[f].files);
				await c.createMessage("**Attachments done**")
			}
		} catch(e) {
			console.log(e);
			return "ERR: "+e.message;
		}

		return;
	},
	permisions: ["manageMessages"]
}