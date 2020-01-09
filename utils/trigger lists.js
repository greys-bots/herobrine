module.exports = {
	getTriggerLists: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM triggers WHERE user_id = ?`, [user], {
				id: Number,
				hid: String,
				user_id: String,
				name: String,
				list: val => val ? JSON.parse(val) : null,
				private: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows);
			})
		})
	},
	getTriggerList: async (bot, user, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM triggers WHERE hid = ?`, [hid], {
				id: Number,
				hid: String,
				user_id: String,
				name: String,
				list: val => val ? JSON.parse(val) : null,
				private: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(!rows[0].private || (rows[0].private && user == rows[0].user_id)) res(rows[0]);
					else res("private");
				}
			})
		})
	},
	addTriggerList: async (bot, user, hid, name, list, private) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO triggers (hid, user_id, name, list, private) VALUES (?,?,?,?,?)`, [hid, user, name, list, private], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateTriggerList: async (bot, user, hid, data) => {
		return new Promise(res => {
			bot.db.query(`UPDATE triggers SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE user_id=? AND hid=?`, [...Object.values(data), user, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteTriggerList: async (bot, user, hid) => {
		return new Promise(res => {
		bot.db.query(`DELETE FROM triggers WHERE user_id = ? AND hid = ?`,[user, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			});
		})
	},
	handleTriggerReactions: async function(bot, m, emoji, user) {
		await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, this.user);
		switch(emoji.name) {
			case "\u2b05":
				if(this.index == 0) {
					this.index = this.data.embeds.length-1;
				} else {
					this.index -= 1;
				}
				await bot.editMessage(m.channel.id, m.id, this.data.embeds[this.index]);
				bot.menus[m.id] = this;
				break;
			case "\u27a1":
				if(this.index == this.data.embeds.length-1) {
					this.index = 0;
				} else {
					this.index += 1;
				}
				await bot.editMessage(m.channel.id, m.id, this.data.embeds[this.index]);
				bot.menus[m.id] = this;
				break;
			case "\u23f9":
				await bot.deleteMessage(m.channel.id, m.id);
				delete bot.menus[m.id];
				break;
			case "\u270f":
				if(!user == this.data.list.user_id) return;
				var resp;
				await m.channel.createMessage([
					"What would you like to do?",
					"```",
					"1 - Rename the list",
					"2 - Add triggers to the list",
					"3 - Remove triggers from the list",
					"4 - Set triggers on the list",
					"```"
				].join("\n"));
				resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {time: 60000, maxMatches: 1});
				if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out. Aborting");
				switch(resp[0].content) {
					case "1":
						await m.channel.createMessage("What would you like to name the list?");
						resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {time: 60000, maxMatches: 1});
						if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out. Aborting");
						if(resp[0].content.length > 100) return m.channel.createMessage("That name is too long. Names must be between 1 and 100 characters in length");

						bot.commands.get("triggers").subcommands.get("rename").execute(bot, this.data.msg, [this.data.list.hid, resp[0].content])
						break;
					case "2":
						bot.commands.get("triggers").subcommands.get("add").execute(bot, this.data.msg, [this.data.list.hid])
						break;
					case "3":
						bot.commands.get("triggers").subcommands.get("remove").execute(bot, this.data.msg, [this.data.list.hid])
						break;
					case "4":
						bot.commands.get("triggers").subcommands.get("set").execute(bot, this.data.msg, [this.data.list.hid])
						break;
					default:
						return m.channel.createMessage("ERR: invalid option given. Aborting");
						break;
				}
				break;
			case "❌":
				if(user != this.data.list.user_id) return;
				await m.channel.createMessage("Are you sure you want to delete this list? (y/n)");
				var resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 30000});
				if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
				if(resp[0].content.toLowerCase() != "y") return m.channel.createMessage("Action cancelled");
				var scc = await bot.utils.deleteTriggerList(bot, user, this.data.list.hid);
				if(scc) {
					m.channel.createMessage("List deleted!");
					if(m.channel.guild) {
						try {
							await m.removeReactions();
						} catch(e) {
							console.log(e);
							m.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
						}
					}
					delete bot.menus[m.id];
				}
				else m.channel.createMessage("Something went wrong")
				break;
		}
	}
}