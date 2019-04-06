const fetch = require("node-fetch");

module.exports = {
	help: ()=> "Archives messages in a given channel and DMs you a text file containing them.",
	usage: ()=> [" <number> - archives [number] messages, or 100 by default"],
	execute: (bot, msg, args)=> {
		msg.channel.getMessages((args[0] == NaN ? 100 : args[0])).then(async (msgs)=>{
			var data = [];
			var attachments = {};
			if(args[1] && !msg.mentions[0]) {
				if(bot.users.find(u => u.id == args[1])) {
					var memb = bot.users.find(u => u.id == args[1])
					msgs = msgs.filter(x => x.author.id == memb.id)
				} else {
					return msg.channel.createMessage("Can't find that user.")
				}
			} else if(msg.mentions[0]) {
				msgs = msgs.filter(x => x.author.id == msg.mentions[0].id);
			} else if(args[1] && args[1].toLowerCase() == "self") {
				msgs = msgs.filter(x => x.author.id == msg.author.id);
			}
			await Promise.all(msgs.map(async m => {
				var date = new Date(m.timestamp);
				data.push([`ID: ${m.id}`,
							`\r\n${m.author.username}#${m.author.discriminator + (m.author.bot ? " BOT" : "")} (${m.author.id})`,
							` | ${date.getMonth()+1}.${date.getDate()}.${date.getFullYear()}`,
							` at ${date.getHours()}:${date.getMinutes()}`,
							`\r\n${m.content}`].join(""));
				if (m.attachments[0]) {
					attachments[m.id] = {content: `Attachments for Message ID ${m.id}`, files: []};
					await Promise.all(m.attachments.map(async (f,i) => {
						var att = await fetch(f.url);
						attachments[m.id].files.push({file: Buffer.from(await att.buffer()), name: f.filename});
						return new Promise(res => {
							setTimeout(()=> res(1), 100);
						})
					}))
				}
				return new Promise((res,rej)=>{
					setTimeout(res(1),100)
				})
			})).then(()=> {
				msg.author.getDMChannel().then(async c => {
					c.createMessage("Here is the archive: ",{file: Buffer.from(data.reverse().join("\r\n------\r\n")),name: msg.channel.name+".txt"}).then(async ()=>{
						if(Object.keys(attachments)[0]) {
							c.createMessage("**Attachments incoming:**");
							await Promise.all(Object.keys(attachments).map(f => {
								bot.createMessage(c.id, attachments[f].content, attachments[f].files);
							})).then(()=> {
								c.createMessage("**Attachments done**")
							})
						}
					})
				})
			}).catch(e => {
				console.log(e);
				msg.channel.createMessage("There was an error.")
			})
		}).catch(e => {
			console.log(e);
			msg.channel.createMessage("There was an error.");
		})
	},
	permisions: ["manageMessages"],
	module: "admin"
}

