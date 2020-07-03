const {Collection} = require("discord.js");

class ProfileStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO profiles (
					user_id,
					title,
					bio,
					color,
					badges,
					lvl,
					exp,
					cash,
					daily,
					disabled
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
				[user, data.title, data.bio,
				 data.color, data.badges || {}, data.lvl || 1, data.exp || 0,
				 data.cash || 0, data.daily, data.disabled || false])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(user));
		})
	}

	async index(user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO profiles (
					user_id,
					title,
					bio,
					color,
					badges,
					lvl,
					exp,
					cash,
					daily,
					disabled
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
				[user, data.title, data.bio,
				 data.color, data.badges || {}, data.lvl || 1, data.exp || 0,
				 data.cash || 0, data.daily, data.disabled || false])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(user, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var profile = super.get(config);
				if(profile) return res(profile);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM profiles WHERE user_id = $1`,[user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(user, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async update(user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE profiles SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE user_id = $1`,[user, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(server, true));
		})
	}

	async delete(user) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM profiles WHERE user_id = $1`, [user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(user);
			res();
		})
	}

	async handleBonus(user) {
		return new Promise(async (res, rej) => {
			var prof = await this.get(user);
			if(!prof) {
				var scc = await this.create(user);
				return res({success: scc, msg: null});
			}

			var curlvl = prof.lvl;

			if(prof.exp+5 >= (Math.pow(prof.lvl, 2) + 100)){
				prof.lvl = prof.lvl + 1;
				if(prof.exp - (Math.pow(prof.lvl, 2) + 100) >= 0){
					prof.exp = prof.exp - (Math.pow(prof.lvl, 2) + 100);
				} else {
					prof.exp = 0;
				}
			} else prof.exp += 5;

			try {
				await this.update(prof.user_id, {exp: prof.exp, lvl: prof.lvl, cash: prof.cash + 5})
			} catch(e) {
				return rej(e);
			}

			if(!prof.disabled && prof.lvl > curlvl) res({success: true, lvl: prof.lvl});
			else res({success: true})
		})
	}
}

module.exports = (bot, db) => new ProfileStore(bot, db);