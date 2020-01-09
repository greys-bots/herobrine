module.exports = {
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
	},
	handleNoteReactions: async function(bot, m, e, user) {
		switch(e.name) {
			case '⏹️':
				await m.delete();
				delete bot.menus[m.id];
				break;
			case "\u270f":
				var resp;
				await m.channel.createMessage([
					"What would you like to edit?",
					"```",
					"1 - Title",
					"2 - Body",
					"```"
				].join("\n"));
				resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 30000});
				if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
				switch(resp[0].content) {
					case "1":
						await m.channel.createMessage("Enter the new title. You have 1 minute to do this");
						resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 60000});
						if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
						if(resp[0].content.length > 100) return m.channel.createMessage("ERR: title must be 100 characters or less");
						var scc = await bot.utils.editNote(bot, this.user, this.data.hid, "title", resp[0].content);
						if(scc) m.channel.createMessage("Note edited!");
						else m.channel.createMessage("Something went wrong");
						m.edit({embed: {
							title: resp[0].content,
							fields: m.embeds[0].fields
						}})
						if(m.channel.guild) {
							try {
								await m.removeReactions();
							} catch(e) {
								console.log(e);
								m.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
							}
						}
						delete bot.menus[m.id];
						break;
					case "2":
						await m.channel.createMessage("Enter the new body. You have 5 minutes to do this");
						resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 5*60000});
						if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
						var scc = await bot.utils.editNote(bot, this.user, this.data.hid, "body", resp[0].content);
						if(scc) m.channel.createMessage("Note edited!");
						else m.channel.createMessage("Something went wrong");
						m.edit({embed: {
							title: m.embeds[0].title,
							fields: resp[0].content.match(/.{1,1024}/gs).map((s,i)=> {
								return {
									name: `Body${i>0 ? " (cont)" : ""}`,
									value: s
								}
							})
						}})
						if(m.channel.guild) {
							try {
								await m.removeReactions();
							} catch(e) {
								console.log(e);
								m.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
							}
						}
						delete bot.menus[m.id];
						break;
					default:
						return m.channel.createMessage("ERR: invalid input. Aborting...")
						break;
				}
				break;
			case "❌":
				await m.channel.createMessage("Are you sure you want to delete this note? (y/n)");
				var resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 30000});
				if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
				if(resp[0].content.toLowerCase() != "y") return m.channel.createMessage("Action cancelled");
				var scc = await bot.utils.deleteNote(bot, user, this.data.hid);
				if(scc) {
					m.channel.createMessage("Note deleted!");
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