module.exports = {
	help: ()=> "Archives messages in a given channel and DMs you a text file containing them.",
	usage: ()=> [" <number> - archives [number] messages, or 100 by default"],
	execute: (bot, msg, args)=> {
		msg.channel.getMessages(args[0] || 100).then(async (msgs)=>{
			var data = [];
			await Promise.all(msgs.map(m => {
				var date = new Date(m.timestamp);
				data.push([`${m.author.username}#${m.author.discriminator + (m.author.bot ? " BOT" : "")} (${m.author.id})`,
							` | ${date.getMonth()+1}.${date.getDate()}.${date.getFullYear()}`,
							` at ${date.getHours()}:${date.getMinutes()}`,
							`\r\n${m.content}`].join(""));
				return new Promise((res,rej)=>{
					setTimeout(res(1),100)
				})
			})).then(()=> {
				msg.author.getDMChannel().then(c => {
					c.createMessage("Here is the archive: ",{file: Buffer.from(data.reverse().join("\r\n------\r\n")),name: "archive.txt"})
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