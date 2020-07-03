const {Collection} = require("discord.js");

class NoteStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(user, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO notes (
					hid,
					user_id,
					title,
					body
				) VALUES ($1,$2,$3,$4)`,
				[hid, user, data.title, data.body])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(user, hid));
		})
	}

	async index(user, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO notes (
					hid,
					user_id,
					title,
					body
				) VALUES ($1,$2,$3,$4)`,
				[hid, user, data.title, data.body])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(user, hid, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var note = super.get(`${user}-${hid}`);
				if(note) return res(note);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM notes WHERE user_id = $1 AND hid = $2`,[user, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(`${user}-${hid}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(user) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM notes WHERE user_id = $1`,[user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(user, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE notes SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE user_id = $1 AND hid = $2`,[user, hid, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(user, hid, true));
		})
	}

	async delete(user, hid) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM notes WHERE user_id = $1 AND hid = $2`, [user, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${user}-${hid}`);
			res();
		})
	}

	async deleteAll(user) {
		return new Promise(async (res, rej) => {
			try {
				var notes = await this.getAll(user);
				await this.db.query(`DELETE FROM notes WHERE user_id = $1`, [user]);
				for(var note of notes) super.delete(`${user}-${note.hid}`)
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async handleNoteReactions(bot, m, e, user) {
		switch(e.name) {
			case '⏹️':
				await m.delete();
				delete this.bot.menus[m.id];
				break;
			case "✏️":
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
						try {
							await this.update(this.user, this.data.hid, "title", resp[0].content);
						} catch(e) {
							return await m.channel.createMessage("ERR: "+e);
						}
						
						await m.channel.createMessage("Note edited!");
						if(m.channel.guild) {
							try {
								await m.removeReactions();
							} catch(e) {
								console.log(e);
								m.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
							}
						}
						delete this.bot.menus[m.id];
						break;
					case "2":
						await m.channel.createMessage("Enter the new body. You have 5 minutes to do this");
						resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 5*60000});
						if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
						try {
							await this.update(this.user, this.data.hid, "body", resp[0].content);
						} catch(e) {
							return await m.channel.createMessage("ERR: "+e);
						}
						
						await m.channel.createMessage("Note edited!");
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
						delete this.bot.menus[m.id];
						break;
					default:
						return await m.channel.createMessage("ERR: invalid input. Aborting...")
						break;
				}
				break;
			case "❌":
				await m.channel.createMessage("Are you sure you want to delete this note? (y/n)");
				var resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 30000});
				if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
				if(resp[0].content.toLowerCase() != "y") return m.channel.createMessage("Action cancelled");
				try {
					await this.delete(user, this.data.hid);
				} catch(e) {
					return await m.channel.createMessage("ERR: "+e);
				}
				
				await m.channel.createMessage("Note deleted!");
				if(m.channel.guild) {
					try {
						await m.removeReactions();
					} catch(e) {
						console.log(e);
						m.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
					}
				}
				delete this.bot.menus[m.id];
				break;
		}
	}
}

module.exports = (bot, db) => new NoteStore(bot, db);