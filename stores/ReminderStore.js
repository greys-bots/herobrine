const {Collection} = require("discord.js");

class ReminderStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(user, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO reminders (
					hid,
					user_id,
					note,
					time,
					recurring,
					interval
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[hid, user, data.note, data.time, data.recurring || false, data.interval])
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
				await this.db.query(`INSERT INTO reminders (
					hid,
					user_id,
					note,
					time,
					recurring,
					interval
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[hid, user, data.note, data.time, data.recurring || 0, data.interval])
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
				var reminder = super.get(`${user}-${hid}`);
				if(reminder) return res(reminder);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM reminders WHERE user_id = $1 AND hid = $2`,[user, hid]);
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
				var data = await this.db.query(`SELECT * FROM reminders WHERE user_id = $1`,[user]);
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
				await this.db.query(`UPDATE reminders SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE user_id = $1 AND hid = $2`,[user, hid, ...Object.values(data)]);
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
				await this.db.query(`DELETE FROM reminders WHERE user_id = $1 AND hid = $2`, [user, hid]);
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
				var reminders = await this.getAll(user);
				await this.db.query(`DELETE FROM reminders WHERE user_id = $1`, [user]);
				for(var reminder of reminders) super.delete(`${user}-${reminder.hid}`)
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new ReminderStore(bot, db);