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
	asyncForEach: async function(array,callback){
		console.log(array);
		console.log(array.length);
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

	//configs
	getConfig: async function(bot, srv){
		return new Promise((res)=> {
			bot.db.query(`SELECT * FROM configs WHERE srv_id='${srv}'`,
			{
				srv_id: String,
				prefix: String,
				welcome: JSON.parse,
				autoroles: String,
				disabled: JSON.parse,
				opped: String,
				feedback: JSON.parse,
				logged: JSON.parse,
				autopin: JSON.parse,
				aliases: JSON.parse
			},(err,rows)=>{
				if(err){
					console.log(err)
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	updateConfig: async function(bot,srv,key,val) {
		return new Promise((res)=> {
			bot.db.query(`UPDATE configs SET ?=? WHERE srv_id=?`,[key, val, srv], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	createConfig: async (bot, guild) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO configs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[guild,"",{},"",{},"",{},[],{},[]],(err,rows)=>{
				if(err) return console.log(err);
				console.log(`Config for guild ID ${guild} successfully created`);
			})
		})
	},

	//commands
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
	
	//starring
	starMessage: async function(bot, msg, channel, data) {
		var attach = [];
		if(msg.attachments[0]) {
			await Promise.all(msg.attachments.map(async (f,i) => {
				var att = await bot.fetch(f.url);
				attach.push({file: Buffer.from(await att.buffer()), name: f.filename});
				return new Promise(res => {
					setTimeout(()=> res(1), 100);
				})
			}))
		}
		var embed = {
			author: {
				name: `${msg.author.username}#${msg.author.discriminator}`,
				icon_url: msg.author.avatarURL
			},
			footer: {
				text: msg.channel.name
			},
			description: (msg.content || "*(image only)*") + `\n\n[Go to message](https://discordapp.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`,
			timestamp: new Date(msg.timestamp)
		}
		bot.createMessage(channel, {content: `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`,embed: embed}, attach ? attach : null).then(message => {
			bot.db.query(`INSERT INTO starboard (server_id, channel_id, message_id, original_id, emoji) VALUES (?,?,?,?,?)`,[
				message.guild.id,
				message.channel.id,
				message.id,
				msg.id,
				data.emoji
			])
		});
	},
	updateStarPost: async (bot, server, msg, data) => {
		return new Promise((res) => {
			bot.db.query(`SELECT * FROM starboard WHERE original_id=? AND server_id=? AND emoji=?`,[msg, server, data.emoji], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					var post = rows[0];
					if(!post) return res(true);
					try {
						if(data.count > 0) bot.editMessage(post.channel_id, post.message_id, `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`);
						else bot.deleteMessage(post.channel_id, post.message_id);
					} catch(e) {
						console.log(e);
						return res(false);
					}
					res(true);
					
				}
			})
		})
	},
	getStarPost: async (bot, server, msg, emoji) => {
		return new Promise((res) => {
			bot.db.query(`SELECT * FROM starboard WHERE server_id=? AND original_id=? AND emoji=?`,[server, msg, emoji], (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					res(rows[0]);
				}
			})
		})
	},

	//react roles
	getReactionRoles: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactroles WHERE server_id=?`,[id],(err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	getReactionRole: async (bot, id, role) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactroles WHERE server_id=? AND role_id=?`,[id, role],(err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	getReactionRolesByCategory: async (bot, serverid, categoryid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=? AND hid=?`,[serverid, categoryid], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse
			}, async (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0].roles) {
						var roles = [];
						await Promise.all(rows[0].roles.map((r,i) => {
							return new Promise(res2 => {
								bot.db.query(`SELECT * FROM reactroles WHERE id=?`,[r], (err, rls)=> {
									roles[i] = rls[0]
								});
								setTimeout(()=> res2(''), 100)
							})
						})).then(()=> {
							res(roles)
						})
					} else {
						res(undefined);
					}

				}
			})
		})
	},
	deleteReactionRole: async (bot, id, role) => {
		return new Promise(async res => {
			var rr = await bot.utils.getReactionRole(bot, id, role);
			if(!rr) return res(true);

			bot.db.query(`DELETE FROM reactroles WHERE server_id = ? AND role_id = ?`,[id, rr.role_id], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					console.log("Deleted role")
					res(true)
				}
			});

			var cats = await bot.utils.getReactionCategorieswithRole(bot, id, rr.id);
			if(cats) {
				var scc = await bot.utils.updateReactionCategories(bot, id, cats.map(c => c.hid), "remove", rr.id);
				if(!scc) return res(false);
			}

			var posts = await bot.utils.getReactPostswithRole(bot, id, rr.role_id);
			if(posts) {
				var scc2 = await bot.utils.updateReactPosts(bot, id, posts.map(p => p.message_id), "remove", rr.role_id);
				if(!scc2) return res(false);
			}
		})
	},
	deleteReactionRoles: async (bot, server, roles) => {
		return new Promise(async res => {
			bot.db.query(`DELETE FROM reactroles WHERE server_id = ? AND role_id IN (${roles.join(",")})`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true)
			});
		})
	},

	//react posts
	genReactPosts: async (bot, roles, msg, info = {}) => {
		return new Promise(async res => {
			var embeds = [];
			var current = { embed: {
				title: info.title,
				description: info.description,
				fields: []
			}, roles: [], emoji: []};
			
			for(let i=0; i<roles.length; i++) {
				if(current.embed.fields.length < 10) {
					var rl = msg.guild.roles.find(x => x.id == roles[i].role_id);
					if(rl) {
					 	current.embed.fields.push({name: `${rl.name} (${roles[i].emoji.includes(":") ? `<${roles[i].emoji}>` : roles[i].emoji})`, value: roles[i].description || "*(no description provided)*"});
					 	current.roles.push({role_id: roles[i].role_id, emoji: roles[i].emoji});
					 	current.emoji.push(roles[i].emoji);
					}
				} else {
					embeds.push(current);
					current = { embed: {
						title: info.title,
						description: info.description,
						fields: []
					}, roles: [], emoji: []};
					var rl = msg.guild.roles.find(x => x.id == roles[i].role_id);
					if(rl) {
					 	current.embed.fields.push({name: `${rl.name} (${roles[i].emoji.includes(":") ? `<${roles[i].emoji}>` : roles[i].emoji})`, value: roles[i].description || "*(no description provided)*"});
					 	current.roles.push({role_id: roles[i].role_id, emoji: roles[i].emoji});
					 	current.emoji.push(roles[i].emoji);
					}
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
	getReactPosts: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactposts WHERE server_id = ?`, [id],
			{
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String,
				roles: JSON.parse,
				page: Number
			},(err, rows)=> {
				if(err) {
					console.log(err);
					return res(undefined)
				} else {
					if(rows[0]) res(rows);
					else res(undefined);
				}
			})
		})
	},
	getReactPost: async (bot, id, postid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactposts WHERE server_id=? AND message_id=?`,[id, postid],{
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String,
				roles: JSON.parse,
				page: Number
			},(err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	addReactPost: async (bot, server, channel, message, roles, page) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO reactposts (server_id, channel_id, message_id, roles, page) VALUES (?,?,?,?,?)`,
				[server, channel, message, roles, page], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true);
				}
			})
		})
	},
	getReactPostswithRole: async (bot, id, role) => {
		return new Promise(async res => {
			var posts = await bot.utils.getReactPosts(bot, id);
			if(posts) posts = posts.filter(r => r.roles.filter(rl => rl.role_id == role)[0]);
			if(posts) res(posts);
			else res(undefined);
		})
	},
	updateReactCategoryPosts: async (bot, id, msg, categoryid) => {
		return new Promise(async res => {
			var cat = await bot.utils.getReactionCategory(bot, id, categoryid);
			if(!cat) return res(false);
			if(!cat.posts || !cat.posts[0]) return res(true);
			var roles = await bot.utils.getReactionRolesByCategory(bot, msg.guild.id, cat.hid);
			if(!roles) return res(false);
			if(roles.length == 0) {
				await Promise.all(cat.posts.map(async p => {
					var pst = await bot.utils.getReactPost(bot, id, p);
					if(!pst) return Promise.resolve("")
					var message = await bot.getMessage(pst.channel_id, pst.message_id);
					if(!message) return Promise.resolve("")
					await message.delete();
					bot.db.query(`DELETE FROM reactposts WHERE server_id = ? AND message_id=?`, [
						message.guild.id,
						message.id
					], (err, rows)=> {
						if(err) console.log(err);
					})

				}))
			} else if(roles.length <= 10) {
				await Promise.all(cat.posts.map(async p => {
					var pst = await bot.utils.getReactPost(bot, id, p);
					if(!pst) return Promise.resolve("")
					var message = await bot.getMessage(pst.channel_id, pst.message_id);
					if(!message) return Promise.resolve("")
					if(pst.page > 0) return await message.delete();
					console.log(pst.page);

					bot.editMessage(message.channel.id, message.id, {embed: {
						title: cat.name,
						description: cat.description,
						fields: roles.map(r => {
							var rl = msg.guild.roles.find(x => x.id == r.role_id);
							return {name: `${rl.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`, value: r.description || "*(no description provided)*"}
						})
					}}).then(message => {	
						var emoji = roles.map(r => r.emoji);
						var oldreacts = Object.keys(message.reactions)
										.filter(rr => message.reactions[rr].me)
										.filter(rr => !emoji.includes(rr) && !emoji.includes(":"+rr));
						emoji.forEach(rc => message.addReaction(rc));
						oldreacts.forEach(rc => message.removeReaction(rc.replace(/^:/,"")));

						bot.db.query(`UPDATE reactposts SET roles = ?, page=? WHERE server_id = ? AND message_id=?`,[
							roles.map(r => {return {emoji: r.emoji, role_id: r.role_id}}),
							0,
							message.guild.id,
							message.id
						], (err, rows)=> {
							if(err) console.log(err);
						})
					}).catch(e => {
						console.log(e);
						res(false)
					})

				}))
			} else {
				var posts = await bot.utils.genReactPosts(bot, roles, msg, {
					title: cat.name,
					description: cat.description
				})
				await Promise.all(cat.posts.map(async p => {
					var pst = await bot.utils.getReactPost(bot, id, p);
					if(!pst) return Promise.resolve("");
					var message = await bot.getMessage(pst.channel_id, pst.message_id);
					if(!message) return Promise.resolve("");
					bot.editMessage(message.channel.id, message.id, {embed: posts[pst.page].embed}).then(message => {	
						var emoji = posts[pst.page].emoji;
						var oldreacts = Object.keys(message.reactions)
										.filter(rr => message.reactions[rr].me)
										.filter(rr => !emoji.includes(rr) && !emoji.includes(":"+rr));
						emoji.forEach(async rc => message.addReaction(rc));
						oldreacts.forEach(rc => message.removeReaction(rc.replace(/^:/,"")));


						bot.db.query(`UPDATE reactposts SET roles = ? WHERE server_id = ? AND message_id=?`,[
							posts[pst.page].roles,
							message.guild.id,
							message.id
						], (err, rows)=> {
							if(err) console.log(err);
						})
					}).catch(e => {
						console.log(e);
						res(false)
					})

				}))
			}
			
			res(true);
		})
	},
	updateReactPosts: async (bot, id, msgs, action, data) => {
		return new Promise(async res => {
			await Promise.all(msgs.map(m => {
				return new Promise(async res2 => {
					var post = await bot.utils.getReactPost(bot, id, m);
					if(action && action == "remove") {
						post.roles = post.roles.filter(x => x.role_id != data);
						bot.db.query(`UPDATE reactposts SET roles = ? WHERE server_id = ? AND message_id = ?`,[post.roles, id, m]);
					}
					try {
						await bot.utils.updateReactPost(bot, id, m)
					} catch(e) {
						console.log(e);
					}
					setTimeout(()=> res2(), 100);
				})
			})).then(()=> {
				res(true);
			})
		})
	},
	updateReactPost: async (bot, id, msg) => {
		return new Promise(async res => {
			var post = await bot.utils.getReactPost(bot, id, msg);
			if(!post) return res(true);
			var message = await bot.getMessage(post.channel_id, post.message_id);
			if(!message) return res(false);

			console.log(post.roles);
			if(post.roles.length == 0) {
				await message.delete();
				bot.db.query(`DELETE FROM reactposts WHERE server_id = ? AND message_id = ?`,[id, msg],(err, rows) => {
					if(err) {
						console.log(err);
						res(false);
					} else {
						res(true);
					}
				})
			} else {
				var curembed = message.embeds[0];
				var roles = [];
				await Promise.all(post.roles.map(rl => {
					return new Promise(async res2 => {
						var r = await bot.utils.getReactionRole(bot, id, rl.role_id);
						var r2 = message.channel.guild.roles.find(x => x.id == rl.role_id);
						roles.push({name: `${r2.name} (${r.emoji})`, description: r.description || "*(no description provided)*", emoji: r.emoji});
						res2('');
					})
				}))
				console.log(roles);
				await bot.editMessage(post.channel_id, post.message_id, {embed: {
					title: curembed.title,
					description: curembed.description,
					fields: roles.map(r => { return {name: r.name, value: r.description}})
				}}).then(async (message)=> {
					var emoji = roles.map(r => r.emoji);
					var oldreacts = await Object.keys(message.reactions)
									.filter(rr => message.reactions[rr].me)
									.filter(rr => !emoji.includes(rr) && !emoji.includes(":"+rr));
					bot.utils.asyncForEach(emoji, async rc => await message.addReaction(rc));
					bot.utils.asyncForEach(oldreacts, async rc => await message.removeReaction(rc.replace(/^:/,"")));
				}).catch(e => {
					console.log(e);
					res(false)
				})
			}
		})
	},
	getHighestPage: async (bot, id, hid) => {
		return new Promise(async res => {
			var category = await bot.utils.getReactionCategory(bot, id, hid);
			if(!category) return res(false);
			bot.db.query(`SELECT MAX(page) AS max FROM reactposts WHERE message_id IN (${category.posts.join(", ")})`, (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					console.log(rows[0].max)
					res(rows[0].max)
				}
			})
		})
	},
	deleteReactPost: async (bot, id, msg) => {
		return new Promise(async res => {
			var categories = await bot.utils.getReactionCategories(bot, id);
			
			bot.db.query(`BEGIN TRANSACTION`);
			categories.forEach(cat => {
				bot.db.query(`UPDATE reactcategories SET posts = ? WHERE hid = ? AND server_id = ?`, [cat.posts.filter(x => x != msg), cat.hid, id]);
			})
			bot.db.query(`DELETE FROM reactposts WHERE server_id = ? AND message_id = ?`,[id, msg]);
			bot.db.query(`COMMIT`);

			return res(true);
		})
	},

	//react categories
	getReactionCategories: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=?`,[id], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse,
				posts: JSON.parse
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	createReactionCategory: async (bot, hid, server, name, description) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO reactcategories (hid, server_id, name, description, roles, posts) VALUES (?,?,?,?,?,?)`,
				[hid, server, name, description, [], []], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	getReactionCategory: async (bot, id, categoryid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=? AND hid=?`,[id, categoryid], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse,
				posts: JSON.parse
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	getReactionCategorieswithRole: async (bot, id, role) => {
		console.log("grabbing categories...")
		return new Promise(async res => {
			var categories = await bot.utils.getReactionCategories(bot, id);
			if(categories) categories = categories.filter(c => c.roles.includes(role));
			if(categories) res(categories);
			else res(undefined);
		})
	},
	updateReactionCategory: async (bot, server, hid, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE reactcategories SET ?=? WHERE server_id = ? AND hid = ?`,[key, val, server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateReactionCategories: async (bot, id, hids, action, data) => {
		return new Promise(async res => {
			console.log(hids);
			await Promise.all(hids.map(m => {
				return new Promise(async res2 => {
					var cat = await bot.utils.getReactionCategory(bot, id, m);
					if(action && action == "remove") {
						cat.roles = cat.roles.filter(x => x != data);
						console.log("Updating category "+m);
						bot.db.query(`UPDATE reactcategories SET roles = ? WHERE server_id = ? AND hid = ?`,[cat.roles, id, m]);
					}
					setTimeout(()=> res2(), 100);
				})
			})).then(()=> {
				res(true);
			})
		})
	},
	deleteReactionCategory: async (bot, id, categoryid) => {
		return new Promise(async res => {
			var category = await bot.utils.getReactionCategory(bot, id, categoryid);
			if(!category) return res("true");
			console.log(category);
			category.posts.map(async p => {
				var post = await bot.utils.getReactPost(bot, id, p);
				console.log(post);
				if(!post) return null;
				try {
					bot.deleteMessage(post.channel_id, post.message_id);
				} catch(e) {
					console.log(e)
				}
				bot.db.query(`DELETE FROM reactposts WHERE server_id=? AND message_id=?`,[id, p]);
			})
			bot.db.query(`DELETE FROM reactcategories WHERE server_id=? AND hid=?`,[id, categoryid]);
			res(true);
		})
	},

	//custom responses
	getTags: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM responses WHERE server_id = ?`, [server], {
				id: Number,
				server_id: String,
				name: String,
				value: function(val) {
					if(val && val.startsWith("[") && val.endsWith("]")) return JSON.parse(val);
					else if(val) return val;
					else return undefined;
				}
			}, (err, rows) => {
				if(!rows[0]) {
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	getTag: async (bot, server, name) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM responses WHERE server_id = ? AND name = ?`, [server, name], {
				id: Number,
				server_id: String,
				name: String,
				value: function(val) {
					console.log(val);
					if(val && val.startsWith("[") && val.endsWith("]")) return JSON.parse(val);
					else if(val) return val;
					else return undefined;
				}
			}, (err, rows) => {
				if(rows[0]) {
					console.log(rows[0].value)
					res(rows[0]);
				} else {
					res(undefined);
				}
			})
		})
	},
	createTag: async (bot, server, name, value) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO responses (server_id, name, value) VALUES (?,?,?)`,[server, name, value], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteTag: async (bot, server, name) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM responses WHERE server_id = ? AND name = ?`,[server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateTag: async (bot, server, name, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE responses SET ?=? WHERE server_id = ? AND name = ?`,[key, val, server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},

	//feedback
	addTicket: async (bot, hid, server, user, message, anon) => {
		return new Promise(async res=> {
			bot.db.query(`INSERT INTO feedback (hid, server_id, sender_id, message, anon) VALUES (?,?,?,?,?)`,
				[hid, server, user, message, anon], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(true);
					}
				})
		})
	},
	getTickets: async (bot, server) => {
		return new Promise(async res=> {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ?`, [server],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(rows);
					}
				}) 
		})
	},
	getTicket: async (bot, server, hid) => {
		return new Promise(async res=> {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ? AND hid = ?`, [server, hid],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(rows[0]);
					}
				}) 
		})
	},
	getTicketsFromUser: async (bot, server, id) => {
		return new Promise(async res=> {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ? AND sender_id = ? AND anon = 0`, [server, id],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else {
						res(rows);
					}
				}) 
		})
	},
	searchTickets: async (bot, server, query) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ?`,[server],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(rows.filter(r => r.message.toLowerCase().includes(query)));
				}
			})
		})
	},
	searchTicketsFromUser: async (bot, server, id, query) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM feedback WHERE server_id = ? AND sender_id = ? AND anon = 0`,[server, id],
			{
				id: Number,
				hid: String,
				server_id: String,
				sender_id: String,
				message: String,
				anon: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(rows.filter(r => r.message.toLowerCase().includes(query)));
				}
			})
		})
	},
	deleteTicket: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM feedback WHERE server_id = ? AND hid = ?`,[server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteTickets: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM feedback WHERE server_id = ?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	fetchUser: async (bot, id) => {
		return new Promise(res => {
			var user = bot.users.find(u => u.id == id);
			res(user);
		})
	},

	//profiles
	getProfile: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM profiles WHERE usr_id=?`, [user], {
				usr_id: String,
				info: JSON.parse,
				badges: String,
				lvl: String,
				exp: String,
				cash: String,
				daily: String,
				disabled: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	updateProfile: async (bot, user, key, val) => {
		return new Promise((res)=> {
			bot.db.query(`UPDATE profiles SET ?=? WHERE usr_id=?`,[key, val, user], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	createProfile: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?)`,[user,{title:"Title Here",bio:"Beep boop!"},{},"1","5","5","0",0],(err,rows)=>{
				if(err){
					console.log("Error creating profile: \n"+err);
					res(false)
				} else {
					console.log("profile created");
					res(true)
				}
			})
		})
	},

	//levels and post cash
	handleBonus: async (bot, msg) => {
		return new Promise(async res => {
			var prof = await bot.utils.getProfile(bot, msg.author.id);
			if(!prof) {
				var scc = await bot.utils.createProfile(bot, msg.author.id);
				return res({success: scc, msg: null});
			}
			var exp = parseInt(prof.exp);
			var lve = parseInt(prof.lvl);

			if(exp+5>=(Math.pow(lve,2)+100)){

				lve=lve+1;
				if(exp-(Math.pow(lve,2)+100)>=0){
					exp=exp-(Math.pow(lve,2)+100);
				} else {
					exp=0;
				}

			} else exp=exp+5;

			bot.db.query(`UPDATE profiles SET exp=?, lvl=?, cash = cash+5 WHERE usr_id=?`,[exp, lve, msg.author.id], (err, rows) => {
				if(err) {
					console.log(err);
					res({success: false})
				} else {
					if(!prof.disabled && lve > prof.lvl) res({success: true, msg: `Congratulations, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}! You are now level ${lve}!`});
					else res({success: true})
				}
			});
		})
	},

	//dailies
	checkDaily: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM profiles WHERE usr_id=?`, [user], {
				usr_id: String,
				info: String,
				badges: String,
				lvl: String,
				exp: String,
				cash: String,
				daily: String,
				disabled: Boolean
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res('err')
				} else if(!rows[0]) {
					res('err')
				} else {
					if(Date.now() - parseInt(rows[0].daily) < (24*60*60*1000)) res(true);
					else res(false);
				}
			})
		})
	},
	setDaily: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM profiles WHERE usr_id=?`, [user], {
				usr_id: String,
				info: String,
				badges: String,
				lvl: String,
				exp: String,
				cash: String,
				daily: String,
				disabled: Boolean
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res('err')
				} else {

					bot.db.query(`UPDATE profiles SET cash = cash + 150, daily = ? WHERE usr_id=?`,[Date.now(), user], (err, rows)=> {
						if(err) {
							console.log(err);
							res(false)
						} else res(true)
					})
				}
			})
		})
	},

	//strikes
	getStrikes: async (bot, server, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM strikes WHERE server_id = ? AND user_id = ?`, [server, user], {
				id: Number,
				hid: String,
				server_id: String,
				user_id: String,
				reason: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res(rows);
					else res(undefined);
				}
			})
		})
	},
	addStrike: async (bot, server, user, reason) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO strikes (hid, server_id, user_id, reason) VALUES (?,?,?,?)`,
				[bot.utils.genCode(4, bot.strings.codestab), server, user, reason], (err, rows) => {
					if(err) {
						console.log(err);
						res(false)
					} else res(true);
				})
		})
	},
	deleteStrike: async (bot, server, user, hid) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM strikes WHERE server_id = ? AND user_id = ? AND hid = ?`,[server, user, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	},
	deleteAllStrikes: async (bot, server, user) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM strikes WHERE server_id = ? AND user_id = ?`,[server, user], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	},

	//custom commands
	getCustomCommands: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM commands WHERE server_id=?`,[id],
				{
					id: Number,
					server_id: String,
					name: String,
					actions: JSON.parse,
					target: String,
					del: Number
				}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	getCustomCommand: async (bot, id, name) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM commands WHERE server_id=? AND name=?`,[id, name],
				{
					id: Number,
					server_id: String,
					name: String,
					actions: JSON.parse,
					target: String,
					del: Number
				}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	addCustomCommand: async (bot, server, name, actions, target, del) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO commands (server_id, name, actions, target, del) VALUES (?,?,?,?,?)`,[server, name, actions, target, del], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateCustomCommand: async (bot, server, name, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE commands SET ?=? WHERE server_id = ? AND name = ?`,[key, val, server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteCustomCommand: async (bot, server, name) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM commands WHERE server_id=? AND name=?`,[server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteCustomCommands: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM commands WHERE server_id=?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
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
	},

	//polls
	addPoll: async (bot, hid, server, channel, message, user, title, description, choices, time) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO polls (hid, server_id, channel_id, message_id, user_id, title, 
						  description, choices, active, start) VALUES (?,?,?,?,?,?,?,?,?,?)`,
				[hid, server, channel, message, user, title, description, choices, 1, time], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	getPoll: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM polls WHERE server_id = ? AND channel_id = ? AND message_id = ?`,[server, channel, message], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				user_id: String,
				title: String,
				description: String,
				choices: JSON.parse,
				active: Boolean,
				start: String,
				end: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	getPollByHid: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM polls WHERE server_id = ? AND hid = ?`,[server, hid], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				user_id: String,
				title: String,
				description: String,
				choices: JSON.parse,
				active: Boolean,
				start: String,
				end: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	getPolls: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM polls WHERE server_id = ?`,[server], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				user_id: String,
				title: String,
				description: String,
				choices: JSON.parse,
				active: Boolean,
				start: String,
				end: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res(rows);
					else res(undefined)
				}
			})
		})
	},
	getPollsFromUser: async (bot, server, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM polls WHERE server_id = ?`,[server, user], {
				id: Number,
				hid: String,
				server_id: String,
				channel_id: String,
				message_id: String,
				user_id: String,
				title: String,
				description: String,
				choices: JSON.parse,
				active: Boolean,
				start: String,
				end: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res(rows);
					else res(undefined)
				}
			})
		})
	},
	searchPolls: async (bot, server, user, query) => {
		return new Promise(async res => {
			var polls = await bot.utils.getPolls(bot, server);
			if(!polls) res(undefined);
			if(user) polls = polls.filter(p => p.user_id == user);
			if(query) {
				query = query.toLowerCase()
				polls = polls.filter(p => p.title.toLowerCase().includes(query) || 
												p.description.toLowerCase().includes(query) || 
												p.choices.find(c => c.option.toLowerCase().includes(query)));
			}
			if(polls[0]) res(polls);
			else res(undefined);
		})	
	},
	editPoll: async (bot, server, channel, message, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE polls SET ?=? WHERE server_id = ? AND channel_id = ? AND message_id = ?`,
				[key, val, server, channel, message], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deletePoll: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM polls WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message],
				(err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deletePollsByID: async (bot, server, ids) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM polls WHERE server_id = ? AND message_id IN (${ids.join(",")})`, [server],
				(err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deletePollsByChannel: async (bot, server, channel) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM polls WHERE server_id = ? AND channel_id = ?`, [server, channel],
				(err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deletePollsByServer: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM polls WHERE server_id = ?`, [server],
				(err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deletePollByHID: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM polls WHERE server_id = ? AND hid = ?`, [server, hid],
				(err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	endPoll: async (bot, server, hid, time) => {
		return new Promise(res => {
			bot.db.query(`UPDATE polls SET active=?,end=? WHERE server_id = ? AND hid = ?`,
				[0, time, server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},

	//notes
	createNote: async (bot, user, hid, title, body) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO notes (hid, user_id, title, body) VALUES (?,?,?,?)`,[hid, user, title, body], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	getNoteCount: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT COUNT(*) as count FROM notes WHERE user_id=?`,[user],(err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					console.log(rows);
					res(rows[0].count)
				}
			})
		})
	},
	getNote: async (bot, user, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM notes WHERE user_id=? AND hid=?`,[user, hid], {
				id: Number,
				hid: String,
				user_id: String,
				title: String,
				body: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0])
			})
		})
	},
	getNotes: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM notes WHERE user_id=?`,[user], {
				id: Number,
				hid: String,
				user_id: String,
				title: String,
				body: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows)
			})
		})
	},
	editNote: async (bot, user, hid, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE notes SET ?=? WHERE user_id=? AND hid=?`,[key, val, user, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	},
	deleteNote: async (bot, user, hid) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM notes WHERE user_id=? AND hid=?`,[user, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	},
	deleteNotes: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM notes WHERE user_id=?`,[user], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	}
};