//- - - - - - - - - - Color - - - - - - - -  - - - -

module.exports = {
	help: ()=> "Display a color.",
	usage: ()=> [" [hex code] - sends an image of that color"],
	execute: async (bot, msg, args)=>{
		var c = Util.hex2rgb(args[0]);
		var img;
		new jimp(256,256,args[0],(err,image)=>{
			if(err){
				console.log(err);
				msg.channel.createMessage("Something went wrong.");
			} else {
				var font = (c.r * 0.299) + (c.g * 0.587) + (c.b * 0.114) < 186 ? jimp.FONT_SANS_32_WHITE : jimp.FONT_SANS_32_BLACK;
				jimp.loadFont(font).then(fnt=>{
					image.print(fnt,0,0,{
						text:(args[0].startsWith("#") ? args[0].toUpperCase() : "#" + args[0].toUpperCase()),
						alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
						alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
					}, 256, 256, (err,img,{x,y})=>{
						img.getBuffer(jimp.MIME_PNG,(err,data)=>{
							msg.channel.createMessage({content: "Your color:"},{file:data,name:"color.png"})
						})
					})

				})

			}
		})
	},
	subcommands: {}
}

module.exports.subcommands.change = {
	help: ()=> "Changes your current color",
	usage: ()=>[" [hex color/name/etc] - changes current color to provided color"],
	execute: (bot, msg, args)=>{
		var c = args.join(" ");
		if(c.startsWith("#")) c = c.replace("#","");
		if(Texts.colors[c.toLowerCase()]) c = Texts.colors[c.toLowerCase()];
		if(msg.guild.roles.find(r=>r.name == msg.author.id)){
			var role = msg.guild.roles.find(r=>r.name == msg.author.id);
			role.edit({color:parseInt(c,16)}).then(()=>{
				if(!msg.member.roles.includes(msg.author.id)){
					msg.member.addRole(role.id)
				}
				msg.channel.createMessage("Changed "+msg.author.username+"'s color to #"+c);
			})
		} else {
			msg.guild.createRole({name: msg.author.id,color:parseInt(c,16)}).then((role)=>{
				msg.member.addRole(role.id);
				msg.channel.createMessage("Changed "+msg.author.username+"'s color to #"+c);
			}).catch(e=>{
				console.log(e);
				msg.channel.createMessage("Something went wrong.")
			})
		}
		
	},
	guildOnly: true
}