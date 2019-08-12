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
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
	},
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
			bot.db.query(`SELECT * FROM configs WHERE srv_id=?`,[srv], (err, rows)=> {
				if(err) {
					console.log(err);
				} else {
					if(!rows[0]) {
						bot.db.query(`INSERT INTO configs VALUES (?,?,?,?,?,?,?,?,?)`,[srv, "", {}, "", {}, "", {}, [], {}, []]);
					}
				}
			})
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
	isDisabled: async function(bot, srv, cmd, name){
		return new Promise(async res=>{
			var cfg = await this.getConfig(bot, srv);
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
				console.log(cmd.permissions.filter(p => msg.member.permission.has(p)).length)
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
	genEmbeds: async (arr, genFunc, info = {}) => {
		return new Promise(res => {
			var embeds = [];
			var current = { embed: {
				title: info.title,
				description: info.description,
				fields: []
			}};
			
			for(let i=0; i<arr.length; i++) {
				if(current.embed.fields.length < 10) {
					current.embed.fields.push(genFunc(arr[i]));
				} else {
					embeds.push(current);
					current = { embed: {
						title: info.title,
						description: info.description,
						fields: [genFunc(arr[i])]
					}};
				}
			}
			embeds.push(current);
			if(embeds.length > 1) {
				for(let i = 0; i < embeds.length; i++)
					embeds[i].embed.title += ` (page ${i+1}/${embeds.length}, ${arr.length} total)`;
			}
			res(embeds);
		})
	},
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
						bot.editMessage(post.channel_id, post.message_id, `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`)
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
									console.log(rls[0]);
									roles[i] = rls[0]
								});
								setTimeout(()=> res2(''), 100)
							})
						})).then(()=> {
							console.log(roles);
							res(roles)
						})
					} else {
						res(undefined);
					}

				}
			})
		})
	},
	getReactionRoleByReaction: async (bot, id, emoji, postid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactroles WHERE server_id=? AND emoji=? AND post_id=?`,[id, emoji, postid],(err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	getReactionRolePost: async (bot, id, postid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactposts WHERE server_id=? AND message_id=?`,[id, postid],{
				id: Number,
				server_id: String,
				channel_id: String,
				message_id: String,
				category_id: String,
				roles: JSON.parse
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
	updateReactRolePost: async (bot, msg, roles) => {
		bot.editMessage(msg.channel.id, msg.id, {
			embed: {
				title: "Server Reaction Roles",
				description: "All available roles for the server",
				fields: roles.map(r => {
					var rl = msg.guild.roles.find(x => x.id == r.role_id);
					 if(rl) {
					 	return {name: `${rl.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`, value: r.description || "*(no description provided)*"}
					 } else {
					 	return null
					 }
				}).filter(x => x!=null)
			}
		}).then(message => {
			var reacts = roles.map(r => r.emoji);
			reacts.forEach(rc => message.addReaction(rc));
		})

		var post = await bot.utils.getReactionRolePost(bot, msg.channel.guild.id, msg.id);
		if(post) {
			bot.db.query(`UPDATE reactposts SET roles=? WHERE server_id=? AND channel_id=? AND message_id=?`,[roles.map(r => {return {emoji: r.emoji, role_id: r.role_id}})])
		} else {
			bot.db.query(`INSERT INTO reactposts (server_id, channel_id, message_id, roles) VALUES (?,?,?,?)`, [
				msg.guild.id,
				msg.channel.id,
				msg.id,
				roles.map(r => { return {emoji: r.emoji, role_id: r.role_id} })
			])
		}
	},
	getReactionCategories: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=?`,[id], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse
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
	getReactionCategory: async (bot, id, categoryid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=? AND hid=?`,[id, categoryid], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse
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
	deleteReactionCategory: async (bot, id, categoryid) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM reactcategories WHERE server_id=? AND hid=?`,[id, categoryid]);
			bot.db.query(`SELECT * FROM reactposts WHERE server_id=? AND category_id=?`,[id, categoryid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					rows.forEach(p => {
						try {
							bot.deleteMessage(p.channel_id, p.message_id);
						} catch(e) {
							console.log(e)
						}
					})
				}
			})
			bot.db.query(`DELETE FROM reactposts WHERE server_id=? AND category_id=?`,[id, categoryid]);
			res(true);
		})
	},
	updateReactCategoryPost: async (bot, id, msg, categoryid) => {
		return new Promise(async res => {
			var cat = await bot.utils.getReactionCategory(bot, id, categoryid);
			if(!cat) return res(true);
			var roles = await bot.utils.getReactionRolesByCategory(bot, id, categoryid);
			if(!roles || roles.length == 0 || !roles.find(r => r.post_id)) return res(false);
			var pst = roles.find(r => r.post_id);
			await bot.editMessage(pst.post_channel, pst.post_id, {embed: {
				title: "Server Reaction Roles",
				description: "All available roles for the server",
				fields: roles.map(r => {
					var rl = msg.guild.roles.find(x => x.id == r.role_id);
					return {name: `${rl.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`, value: r.description || "*(no description provided)*"}
				})
			}}).then(message => {	
				console.log(message.reactions);			
				var emoji = roles.map(r => r.emoji);
				var oldreacts = Object.keys(message.reactions)
								.filter(rr => message.reactions[rr].me)
								.filter(rr => !emoji.includes(rr) && !emoji.includes(":"+rr));
				emoji.forEach(rc => message.addReaction(rc));
				oldreacts.forEach(rc => message.removeReaction(rc.replace(/^:/,"")));

				bot.db.query(`UPDATE reactroles SET post_channel = ?, post_id = ? WHERE server_id = ? AND category=?`,[
					message.channel.id,
					message.id,
					message.guild.id,
					cat.id
				], (err, rows)=> {
					if(err) console.log(err);
				})
				res(true);
			}).catch(e => {
				console.log(e);
				res(false)
			})
		})
	}
};