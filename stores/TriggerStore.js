const {Collection} = require("discord.js");

class TriggerStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(user, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO triggers (
					hid,
					user_id,
					name,
					list,
					private
				) VALUES ($1, $2, $3, $4, $5)`,
				[hid, user, data.name || "unnamed", data.list, data.private || false])
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
				await this.db.query(`INSERT INTO triggers (
					hid,
					user_id,
					name,
					list,
					private
				) VALUES ($1, $2, $3, $4, $5)`,
				[hid, user, data.name || "unnamed", data.list, data.private || false])
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
				var list = super.get(`${user}-${hid}`);
				if(list) return res(list);
			}

			try {
				var data = await this.db.query(`SELECT * FROM triggers WHERE user_id = $1 AND hid = $2`, [user, hid])
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
				var data = await this.db.query(`SELECT * FROM triggers WHERE user_id = $1`, [user])
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
				await this.db.query(`UPDATE triggers SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE user_id = $1 AND hid = $2`,[user, hid, ...Object.values(data)]);
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
				await this.db.query(`DELETE FROM triggers WHERE user_id = $1 AND hid = $2`, [user, hid]);
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
				var lists = await this.getAll(user);
				await this.db.query(`DELETE FROM triggers WHERE user_id = $1`, [user]);
				for(var list of lists) super.delete(`${user}-${list.hid}`);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async handleReactions(bot, m, emoji, user) {
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

						var result = await bot.commands.get("triggers").subcommands.get("rename").execute(bot, this.data.msg, [this.data.list.hid, resp[0].content])
						return m.channel.createMessage(result);
						break;
					case "2":
						var result = await bot.commands.get("triggers").subcommands.get("add").execute(bot, this.data.msg, [this.data.list.hid])
						return m.channel.createMessage(result);
						break;
					case "3":
						var result = await bot.commands.get("triggers").subcommands.get("remove").execute(bot, this.data.msg, [this.data.list.hid])
						return m.channel.createMessage(result);
						break;
					case "4":
						var result = await bot.commands.get("triggers").subcommands.get("set").execute(bot, this.data.msg, [this.data.list.hid])
						return m.channel.createMessage(result);
						break;
					default:
						return m.channel.createMessage("ERR: invalid option given. Aborting.");
						break;
				}
				break;
			case "❌":
				if(user != this.data.list.user_id) return;
				await m.channel.createMessage("Are you sure you want to delete this list? (y/n)");
				var resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 30000});
				if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out.");
				if(resp[0].content.toLowerCase() != "y") return m.channel.createMessage("Action cancelled.");

				try {
					await bot.stores.triggers.delete(user, this.data.list.hid);
				} catch(e) {
					return m.channel.createMessage("ERR: "+e);
				}

				m.channel.createMessage("List deleted!");
				if(m.channel.guild) {
					try {
						await m.removeReactions();
					} catch(e) {
						console.log(e);
						m.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `manageMessages` permission.")
					}
				}
				delete bot.menus[m.id];
				break;
		}
	}
}

module.exports = (bot, db) => new TriggerStore(bot, db);