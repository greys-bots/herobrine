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

	genReactPosts: async (bot, roles, info = {}) => {
		return new Promise(async res => {
			var embeds = [];
			var current = { embed: {
				title: info.title,
				description: info.description,
				fields: [],
				footer: info.footer
			}, roles: [], emoji: []};
			
			for(let i=0; i<roles.length; i++) {
				if(current.embed.fields.length < 10) {
					current.embed.fields.push({
						name: `${roles[i].raw.name} (${roles[i].emoji.includes(":") ? `<${roles[i].emoji}>` : roles[i].emoji})`,
						value: `Description: ${roles[i].description || "*(no description provided)*"}\nPreview: ${roles[i].raw.mention}`
					});
					current.roles.push(roles[i].id);
					current.emoji.push(roles[i].emoji);
				} else {
					embeds.push(current);
					current = { embed: {
						title: info.title,
						description: info.description,
						fields: [],
						footer: info.footer
					}, roles: [], emoji: []};
					current.embed.fields.push({
						name: `${roles[i].raw.name} (${roles[i].emoji.includes(":") ? `<${roles[i].emoji}>` : roles[i].emoji})`,
						value: `Description: ${roles[i].description || "*(no description provided)*"}\nPreview: ${roles[i].raw.mention}`
					});
					current.roles.push(roles[i].id);
					current.emoji.push(roles[i].emoji);
				}
			}
			embeds.push(current);
			if(embeds.length > 1) {
				for(let i = 0; i < embeds.length; i++)
					embeds[i].embed.title += ` (part ${i+1}/${embeds.length})`;
			}
			res(embeds);
		})
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
					current.embed.fields.push(await genFunc(arr[i], i, arr));
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
						fields: [await genFunc(arr[i], i, arr)]
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
			case "⬅️":
				if(this.index == 0) {
					this.index = this.data.length-1;
				} else {
					this.index -= 1;
				}
				await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
				if(m.guild) await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, this.user)
				bot.menus[m.id] = this;
				break;
			case "➡️":
				if(this.index == this.data.length-1) {
					this.index = 0;
				} else {
					this.index += 1;
				}
				await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
				if(m.guild) await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, this.user)
				bot.menus[m.id] = this;
				break;
			case "⏹️":
				await bot.deleteMessage(m.channel.id, m.id);
				delete bot.menus[m.id];
				break;
		}
	},

	isDisabled: async (bot, srv, cmd) =>{
		return new Promise(async res=>{
			var cfg = await bot.stores.configs.get(srv);
			if(!cfg || !cfg.disabled) return res(false);
			let dlist = cfg.disabled;
			if(!dlist.commands || !dlist.commands[0]) return res(false);

			if(dlist.commands.includes(cmd.name)) res(true);
			else res(false);
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
	},

	parseDate: (input) => {
		if(typeof input == "string") {
			var match = input.match(/((?:\d+?|\b\w+\s)\s?(?:mo|w|d|h|m|s))/gi);
			if(!match || !match[0]) match = input.match(/\b(mo|w|d|h|m|s)/gi);
			if(!match || !match[0]) return null;
			console.log(match);

			var parsed = {
				mo: 0,
				w: 0,
				d: 0,
				h: 0,
				m: 0,
				s: 0
			}
			var matched = false
			for(var i = 0; i < match.length; i++) {
				var section = match[i].match(/[a-z]$/i)[0];
				console.log(section);
				if(Object.keys(parsed).includes(section)) {
					if(match[i].match(/[0-9]+/gi)) {
						parsed[section] = parseInt(match[i].match(/[0-9]+/gi)[0]);
					} else {
						parsed[section] = 1;
					}
					matched = true;
				}
			}

			console.log(parsed);

			if(!matched) return null;

			var date = new Date(Date.now() + 
								(parsed.mo*30*24*60*1000) +
								(parsed.w*7*24*60*60*1000) +
								(parsed.d*24*60*60*1000) +
								(parsed.h*60*60*1000) +
								(parsed.m*60*1000) +
								(parsed.s*1000));
			console.log(date);
			return {parsed: parsed, date: date};
		} else {
			var parsed = [];
			var err = false;

			for(var i = 0; i<input.length; i++) {
				var match = input[i].match(/\b((?:\d+|\S+\s)?\s?(?:mo|w|d|h|m|s){1})/gi);
				console.log(match);
				if(!match || !match[0]) {
					err = true;
					break;
				}

				parsed.push({parsed: {mo: 0, w: 0, d: 0, h: 0, m: 0, s: 0}});

				var matched = false
				for(var j = 0; j < match.length; j++) {
					var section = match[j].match(/[a-z]/i)[0];
					if(Object.keys(parsed[i].parsed).includes(section)) {
						if(match[j].match(/[0-9]/)) {
							parsed[i].parsed[section] = parseInt(match[j].match(/[0-9]/)[0]);
						} else {
							parsed[i].parsed[section] = 1;
						}
						matched = true;
					}
				}

				parsed[i].date = new Date(Date.now() + 
									(parsed[i].parsed.mo*30*24*60*1000) +
									(parsed[i].parsed.w*7*24*60*60*1000) +
									(parsed[i].parsed.d*24*60*60*1000) +
									(parsed[i].parsed.h*60*60*1000) +
									(parsed[i].parsed.m*60*1000) +
									(parsed[i].parsed.s*1000));
			}
			console.log(err);
			if(err) return null;

			console.log(parsed);

			return parsed
		}
	},
	parseCommandActions: async (bot, cmd) => {
		return new Promise(res => {
			var actions = [];
			cmd.actions.forEach(a => {
				var text = "";
				switch(a.type) {
					// case "if":
					// 	var condition = action.condition;
					// 	var ac = action.action;
					// 	bot.customActions.forEach(ca => {
					// 		var n = ca.regex ? new RegExp(ca.name) : ca.name;
					// 		condition = condition.replace(n, ca.replace)
					// 		ac = ac.replace(n, ca.replace);
					// 	})
					// 	cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
					// 		`if(${condition}) ${ac};`
					// 	), action.success, action.fail]);
					// 	break;
					// case "if:else":
					// 	var condition = action.condition;
					// 	var tr = action.action[0];
					// 	var fls = action.action[1];
					// 	bot.customActions.forEach(ca => {
					// 		var n = ca.regex ? new RegExp(ca.name) : ca.name;
					// 		condition = condition.replace(n, ca.replace)
					// 		tr = tr.replace(n, ca.replace);
					// 		fls = fls.replace(n, ca.replace);
					// 	})

					// 	cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
					// 		`if(${condition}) ${tr};
					// 		 else ${fls}`
					// 	), action.success, action.fail]);
					// 	break;
					case "rr":
						var rl = a.action.match(/rf\('(.*)'\)/);
						text = `Removes role "${rl[1]}"`;
						break;
					case "ar":
						var rl = a.action.match(/rf\('(.*)'\)/);
						text = `Adds role "${rl[1]}"`;
						break;
					case "bl":
						text = "Blacklists target from using the bot";
						break;
				}
				actions.push(text);
			})
			res(actions);
		})
	}
}