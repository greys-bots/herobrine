const {Collection} = require("discord.js");

class StrikeStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(server, hid, user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO strikes (
					hid,
					server_id,
					user_id,
					reason
				) VALUES ($1,$2,$3,$4)`,
				[hid, server, user, data.reason])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, name));
		})
	}

	async index(server, hid, user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO strikes (
					hid,
					server_id,
					user_id,
					reason
				) VALUES ($1,$2,$3,$4)`,
				[hid, server, user, data.reason])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, hid, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var strike = super.get(`${server}-${hid}`);
				if(strike) return res(strike);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM strikes WHERE server_id = $1 AND hid = $2`,[server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(`${server}-${hid}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM strikes WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async getByUser(server, user) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM strikes WHERE server_id = $1 AND user_id = $2`,[server, user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE strikes SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND hid = $2`,[server, hid, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(server, hid, true));
		})
	}

	async delete(server, hid) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM strikes WHERE server_id = $1 AND hid = $2`, [server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${hid}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var strikes = await this.getAll(server);
				await this.db.query(`DELETE FROM strikes WHERE server_id = $1`, [server]);
				for(var strike of strikes) super.delete(`${server}-${strike.hid}`);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async deleteByUser(server, user) {
		return new Promise(async (res, rej) => {
			try {
				var strokes = await this.getByUser(server, user);
				await this.db.query(`DELETE FROM strikes WHERE server_id = $1 AND user_id = $2`, [server, user]);
				for(var strike of strikes) super.delete(`${server}-${strike.hid}`);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new StrikeStore(bot, db);