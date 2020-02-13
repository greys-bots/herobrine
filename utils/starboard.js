module.exports = {
	getStarboards: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT starboards.*, (SELECT COUNT(*) FROM starred_messages WHERE channel_id = starboards.channel_id) as message_count FROM starboards WHERE server_id = ?`, [server], {
				id: Number,
				server_id: String,
				channel_id: String,
				emoji: String,
				override: Boolean,
				tolerance: Number,
				message_count: Number
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else if(rows[0]) res(rows);
				else res(undefined);
			})
		})
	},
	getStarboardByChannel: async (bot, server, channel) => {
		return new Promise(res => {
			bot.db.query(`SELECT starboards.*, (SELECT COUNT(*) FROM starred_messages WHERE channel_id = starboards.channel_id) as message_count FROM starboards WHERE server_id = ? AND channel_id = ?`, [server, channel], {
				id: Number,
				server_id: String,
				channel_id: String,
				emoji: String,
				override: Boolean,
				tolerance: Number,
				message_count: Number
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0]);
			})
		})
	},
	getStarboardByEmoji: async (bot, server, emoji) => {
		return new Promise(res => {
			bot.db.query(`SELECT starboards.*, (SELECT COUNT(*) FROM starred_messages WHERE channel_id = starboards.channel_id) as message_count FROM starboards WHERE server_id = ? AND emoji = ?`, [server, emoji], {
				id: Number,
				server_id: String,
				channel_id: String,
				emoji: String,
				override: Boolean,
				tolerance: Number,
				message_count: Number
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0]);
			})
		})
	},
	addStarboard: async (bot, server, channel, emoji) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO starboards (server_id, channel_id, emoji) VALUES (?,?,?)`, [server, channel, emoji], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateStarboard: async (bot, server, channel, data) => {
		return new Promise(res => {
			bot.db.query(`UPDATE starboards SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id = ? AND channel_id = ?`, [...Object.values(data), server, channel], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteStarboard: async (bot, server, channel) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM starboards WHERE server_id = ? AND channel_id = ?`, [server, channel], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	getStarPost: async (bot, server, msg, emoji) => {
		return new Promise((res) => {
			bot.db.query(`SELECT * FROM starred_messages WHERE server_id=? AND original_id=? AND emoji=?`,[server, msg, emoji], (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined)
				} else {
					res(rows[0]);
				}
			})
		})
	},
	updateStarPost: async (bot, server, msg, data) => {
		return new Promise(async res => {
			var post = await bot.utils.getStarPost(bot, server, msg, data.emoji);
			if(!post) return res(true);
			try {
				if(data.count > 0) await bot.editMessage(post.channel_id, post.message_id, `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`);
				else await bot.deleteMessage(post.channel_id, post.message_id);
			} catch(e) {
				console.log(e);
				return res(false);
			}
			res(true);
		})
	},
	deleteStarPost: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM starred_messages WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	starMessage: async function(bot, msg, channel, data) {
		return new Promise(async res => {
			var attach = [];
			if(msg.attachments && msg.attachments[0]) {
				for(var f of msg.attachments) {
					var att = await bot.fetch(f.url);
					attach.push({file: Buffer.from(await att.buffer()), name: f.filename});
				}
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

			var message = await bot.createMessage(channel, {content: `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`,embed: embed}, attach ? attach : null)
			bot.db.query(`INSERT INTO starred_messages (server_id, channel_id, message_id, original_id, emoji) VALUES (?,?,?,?,?)`,[
				message.guild.id,
				message.channel.id,
				message.id,
				msg.id,
				data.emoji
			], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	handleStarboardReactions: async (bot, msg, emoji, user) => {
		return new Promise(async res => {
			var reaction = msg.reactions[emoji.name.replace(/^:/,"")];
			var board = await bot.utils.getStarboardByEmoji(bot, msg.guild.id, emoji.name);
			if(!board) return;
			var cfg = await bot.utils.getConfig(bot, msg.guild.id);
			var tolerance = board.tolerance ? board.tolerance : cfg.starboard || 2;
			var member = msg.guild.members.find(m => m.id == user);
			if(!member) return;

			var post = await bot.utils.getStarPost(bot, msg.guild.id, msg.id, emoji.name);

			var scc;
			if(post)
				scc = await bot.utils.updateStarPost(bot, msg.guild.id, msg.id, {emoji: emoji.name, count: reaction ? reaction.count : 0});
			else if(reaction.count > tolerance || (board.override && member.permission.has("manageMessages")))
				scc = await bot.utils.starMessage(bot, msg, board.channel_id, {emoji: emoji.name, count: reaction ? reaction.count : 0});
			
			res(scc);
		})
	}
}