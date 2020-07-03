const {Collection} = require("discord.js");

class AliasStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(server, name, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO aliases (
					server_id,
					name,
					command
				) VALUES ($1,$2,$3)`,
				[server, name, data.command])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, name));
		})
	}

	async index(server, name, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO aliases (
					server_id,
					name,
					command
				) VALUES ($1,$2,$3)`,
				[server, name, data.command])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, name, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var alias = super.get(`${server}-${name}`);
				if(alias) return res(alias);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM aliases WHERE server_id = $1 AND name = $2`,[server, name]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(`${server}-${name}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM aliases WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, name, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE aliases SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND name = $2`,[server, name, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(server, name, true));
		})
	}

	async delete(server, name) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM aliases WHERE server_id = $1 AND name = $2`, [server, name]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${name}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var aliases = await this.getAll(server);
				await this.db.query(`DELETE FROM aliases WHERE server_id = $1`, [server]);
				for(var alias of aliases) super.delete(`${server}-${alias.name}`);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new AliasStore(bot, db);