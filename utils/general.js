module.exports = {
	hex2rgb: (hex)=>{
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
	        return r + r + g + g + b + b;
	    });

		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
	},

	toLit: function(str,torep,repwith){
		if(str.indexOf(torep)!==-1){
			var repd=str.replace(torep,repwith);
			return eval('`'+repd+'`');
		} else {
			console.log("Nothing to replace.");
			return eval('`'+str+'`');
		}
	},

	cleanText: function(text){
		if (typeof(text) === "string") {
			return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
		} else	{
			return text;
		}
	},

	genCode: (num,table) =>{
		var codestring="";
		var codenum=0;
		while (codenum<(num==undefined ? 4 : num)){
			codestring=codestring+table[Math.floor(Math.random() * (table.length))];
			codenum=codenum+1;
		}
		return codestring;
	},

	randomText: function(table){
		var r=Math.floor(Math.random() * table.length);
		return table[r];
	},

	asyncForEach: async function(array, callback){
		for (let index = 0; index < array.length; index++) {
			console.log(array[index]);
			await callback(array[index], index, array);
		}
	},

	genEmbeds: async (bot, arr, genFunc, info = {}, fieldnum, extras = {}) => {
		return new Promise(async res => {
			var embeds = [];
			var current = { embed: {
				title: typeof info.title == "function" ?
								info.title(arr[0], 0) : info.title,
						description: typeof info.description == "function" ?
								info.description(arr[0], 0) : info.description,
				color: typeof info.color == "function" ?
						info.color(arr[0], 0) : info.color,
				footer: info.footer,
				fields: []
			}};
			
			for(let i=0; i<arr.length; i++) {
				if(current.embed.fields.length < (fieldnum || 10)) {
					current.embed.fields.push(await genFunc(arr[i], bot));
				} else {
					embeds.push(current);
					current = { embed: {
						title: typeof info.title == "function" ?
								info.title(arr[i], i) : info.title,
						description: typeof info.description == "function" ?
								info.description(arr[i], i) : info.description,
						color: typeof info.color == "function" ?
								info.color(arr[i], i) : info.color,
						footer: info.footer,
						fields: [await genFunc(arr[i], bot)]
					}};
				}
			}
			embeds.push(current);
			if(extras.order && extras.order == 1) {
				if(extras.map) embeds = embeds.map(extras.map);
				if(extras.filter) embeds = embeds.filter(extras.filter);
			} else {
				if(extras.filter) embeds = embeds.filter(extras.filter);
				if(extras.map) embeds = embeds.map(extras.map);
			}
			if(embeds.length > 1) {
				for(let i = 0; i < embeds.length; i++)
					embeds[i].embed.title += (extras.addition != null ? eval("`"+extras.addition+"`") : ` (page ${i+1}/${embeds.length}, ${arr.length} total)`);
			}
			res(embeds);
		})
	},

	paginateEmbeds: async function(bot, m, emoji) {
		switch(emoji.name) {
			case "\u2b05":
				if(this.index == 0) {
					this.index = this.data.length-1;
				} else {
					this.index -= 1;
				}
				await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
				await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, this.user)
				bot.menus[m.id] = this;
				break;
			case "\u27a1":
				if(this.index == this.data.length-1) {
					this.index = 0;
				} else {
					this.index += 1;
				}
				await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
				await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, this.user)
				bot.menus[m.id] = this;
				break;
			case "\u23f9":
				await bot.deleteMessage(m.channel.id, m.id);
				delete bot.menus[m.id];
				break;
		}
	},

	isDisabled: async (bot, srv, cmd, name) =>{
		return new Promise(async res=>{
			var cfg = await bot.utils.getConfig(bot, srv);
			if(!cfg || !cfg.disabled) return res(false);
			let dlist = cfg.disabled;
			name = name.split(" ");
			if(dlist.commands && (dlist.commands.includes(name[0]) || dlist.commands.includes(name.join(" ")))) {
				res(true);
			} else {
				res(false);
			}

		})
	},
	
	checkPermissions: async function(bot, msg, cmd){
		return new Promise((res)=> {
			if(cmd.permissions) {
				if(!cmd.permissions.filter(p => msg.member.permission.has(p)).length == cmd.permissions.length) {
					res(false);
					return;
				}
				res(true);
			} else {
				res(true);
			}
		})
	},

	fetchUser: async (bot, id) => {
		return new Promise(async res => {
			var user = bot.users.find(u => u.id == id);
			try {
				if(!user) user = await bot.getRESTUser(id);
			} catch(e) {
				console.log(e);
				user = undefined;
			}

			res(user);
		})
	}
}