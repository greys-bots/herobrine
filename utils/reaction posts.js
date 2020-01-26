module.exports = {
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
					 	current.embed.fields.push({name: `${rl.name} (${roles[i].emoji.includes(":") ? `<${roles[i].emoji}>` : roles[i].emoji})`, value: `Description: ${roles[i].description || "*(no description provided)*"}\nPreview: ${rl.mention}`});
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
					 	current.embed.fields.push({name: `${rl.name} (${roles[i].emoji.includes(":") ? `<${roles[i].emoji}>` : roles[i].emoji})`, value: `Description: ${roles[i].description || "*(no description provided)*"}\nPreview: ${rl.mention}`});
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
			if(!cat.posts || !cat.posts[0]) return res([{success: true}]);
			var roles = await bot.utils.getReactionRolesByCategory(bot, msg.guild.id, cat.hid);
			if(!roles) return res(false);
			var result = [];
			if(roles.length == 0) {
				for(var i = 0; i < cat.posts.length; i++) {
					var pst = await bot.utils.getReactPost(bot, id, cat.posts[i]);
					if(!pst) contnue;

					try {
						var message = await bot.getMessage(pst.channel_id, pst.message_id);
						await message.delete();
					} catch(e) {
						console.log(e);
						result.push({...pst, success: false});
						continue;
					}
					bot.db.query(`DELETE FROM reactposts WHERE server_id = ? AND message_id=?`, [
						message.guild.id,
						message.id
					], (err, rows)=> {
						if(err) console.log(err);
					})
					result.push({...pst, success: true});
				}
			} else if(roles.length <= 10) {
				for(var i = 0; i < cat.posts.length; i++) {
					var pst = await bot.utils.getReactPost(bot, id, cat.posts[i]);
					if(!pst) continue;
					try {
						var message = await bot.getMessage(pst.channel_id, pst.message_id);
						if(pst.page > 0) {
							await message.delete();
							continue;
						}
						message = await bot.editMessage(message.channel.id, message.id, {embed: {
							title: cat.name,
							description: cat.description,
							fields: roles.map(r => {
								var rl = msg.guild.roles.find(x => x.id == r.role_id);
								return {name: `${rl.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`, value: `Description: ${r.description || "*(no description provided)*"}\nPreview: ${rl.mention}`}
							})
						}})
						var emoji = roles.map(r => r.emoji);
						await message.removeReactions();
						emoji.forEach(rc => message.addReaction(rc));
					} catch(e) {
						console.log(e);
						result.push({...pst, success: false});
						if(e.message.includes("Unknown Message")) await bot.utils.deleteReactPost(bot, pst.server_id, pst.message_id);
						continue;
					}

					bot.db.query(`UPDATE reactposts SET roles = ?, page=? WHERE server_id = ? AND message_id=?`,[
						roles.map(r => {return {emoji: r.emoji, role_id: r.role_id}}),
						0,
						message.guild.id,
						message.id
					], (err, rows)=> {
						if(err) console.log(err);
					})
					result.push({...pst, success: true});
				}
			} else {
				var posts = await bot.utils.genReactPosts(bot, roles, msg, {
					title: cat.name,
					description: cat.description
				})

				for(var i = 0; i < cat.posts.length; i++) {
					var pst = await bot.utils.getReactPost(bot, id, cat.posts[i]);
					if(!pst) continue;
					try {
						var message = await bot.getMessage(pst.channel_id, pst.message_id);
						message = await bot.editMessage(message.channel.id, message.id, {embed: posts[pst.page].embed});
						var emoji = posts[pst.page].emoji;
						await message.removeReactions();
						emoji.forEach(async rc => message.addReaction(rc));
					} catch(e) {
						console.log(e);
						result.push({...pst, success: false});
						if(e.message.includes("Unknown Message")) await bot.utils.deleteReactPost(bot, pst.server_id, pst.message_id);
						continue;
					}

					bot.db.query(`UPDATE reactposts SET roles = ? WHERE server_id = ? AND message_id=?`,[
						posts[pst.page].roles,
						message.guild.id,
						message.id
					], (err, rows)=> {
						if(err) console.log(err);
					})
				}
			}
			console.log(result)
			res(result);
		})
	},
	editReactPost: async (bot, server, channel, message, roles) => {
		return new Promise(res => {
			bot.db.query(`UPDATE reactposts SET roles=? WHERE server_id=? AND channel_id=? AND message_id=?`,[roles, server, channel, message], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			});
		})
	},
	updateReactPosts: async (bot, server, msgs, action, data) => {
		return new Promise(async res => {
			for(var i = 0; i < msgs.length; i++) {
				var post = await bot.utils.getReactPost(bot, server, msgs[i]);
				if(action && action == "remove") {
					post.roles = post.roles.filter(x => x.role_id != data);
					bot.db.query(`UPDATE reactposts SET roles = ? WHERE server_id = ? AND message_id = ?`,[post.roles, server, msgs[i]]);
				}
				try {
					await bot.utils.updateReactPost(bot, server, msgs[i])
				} catch(e) {
					console.log(e);
				}
			}
			res(true);
		})
	},
	updateReactPost: async (bot, server, msg) => {
		return new Promise(async res => {
			var post = await bot.utils.getReactPost(bot, server, msg);
			if(!post) return res(true);
			var message = await bot.getMessage(post.channel_id, post.message_id);
			if(!message) return res(false);

			console.log(post.roles);
			if(post.roles.length == 0) {
				await message.delete();
				bot.db.query(`DELETE FROM reactposts WHERE server_id = ? AND message_id = ?`,[server, msg],(err, rows) => {
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
				for(var i = 0; i < post.roles.length; i++) {
					var r = await bot.utils.getReactionRole(bot, server, post.roles[i].role_id);
					var r2 = message.channel.guild.roles.find(x => x.id == post.roles[i].role_id);
					roles.push({name: `${r2.name} (${r.emoji})`, description: `Description: ${r.description || "*(no description provided)*"}\nPreview: ${r2.mention}`, emoji: r.emoji});
				}

				var message;
				try {
					message = await bot.editMessage(post.channel_id, post.message_id, {embed: {
						title: curembed.title,
						description: curembed.description,
						fields: roles.map(r => { return {name: r.name, value: r.description}})
					}})
				} catch(e) {
					console.log(e);
					return res(false);
				}

				var emoji = roles.map(r => r.emoji);
				try {
					await message.removeReactions();
					emoji.forEach(rc => message.addReaction(rc))
				} catch(e) {
					console.log(e);
				}
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
	deleteReactPost: async (bot, server, message) => {
		return new Promise(async res => {
			var categories = await bot.utils.getReactionCategories(bot, server);
			
			bot.db.query(`BEGIN TRANSACTION`);
			for(var i = 0; i < categories.length; i++) {
				bot.db.query(`UPDATE reactcategories SET posts = ? WHERE hid = ? AND server_id = ?`, [categories[i].posts.filter(x => x != message), categories[i].hid, server]);
			}
			bot.db.query(`DELETE FROM reactposts WHERE server_id = ? AND message_id = ?`,[server, message]);
			bot.db.query(`COMMIT`);

			return res(true);
		})
	},
	handleReactPostReactions: async (bot, msg, emoji, user) => {
		var post = await bot.utils.getReactPost(bot, msg.guild.id, msg.id);
		if(!post) return;
		var role = post.roles.find(r => [emoji.name, "a"+emoji.name].includes(r.emoji));
		if(!role) return;
		role = msg.guild.roles.find(r => r.id == role.role_id);
		if(!role) return;
		var member = msg.guild.members.find(m => m.id == user);
		if(!member) return;

		try {
			if(member.roles.includes(role.id)) msg.guild.removeMemberRole(user, role.id);
			else msg.guild.addMemberRole(user, role.id);
			bot.removeMessageReaction(msg.channel.id, msg.id, emoji.name.replace(/^:/,""), user);
		} catch(e) {
			console.log(e);
			var ch = await bot.getDMChannel(user);
			if(!ch) return false;
			if(e.stack.includes("addGuildMemberRole") || e.stack.includes("removeGuildMemberRole")) ch.createMessage(`Couldn't manage role **${rl.name}** in ${msg.guild.name}. Please let a mod know that something went wrong`);
			else ch.createMessage(`Couldn't remove your reaction in ${msg.guild.name}. Please let a mod know something went wrong`);
			return false;
		}

		return true;
	}
}