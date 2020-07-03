const {Collection} = require("discord.js");

class ResponseStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(server, name, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO responses (
					server_id,
					name,
					value
				) VALUES ($1,$2,$3)`,
				[server, name, data.value])
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
				await this.db.query(`INSERT INTO responses (
					server_id,
					name,
					value
				) VALUES ($1,$2,$3)`,
				[server, name, data.value])
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
				var response = super.get(`${server}-${name}`);
				if(response) return res(response);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM responses WHERE server_id = $1 AND name = $2`,[server, name]);
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
				var data = await this.db.query(`SELECT * FROM responses WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async update(server, name, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE responses SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND name = $2`,[server, name, ...Object.values(data)]);
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
				await this.db.query(`DELETE FROM responses WHERE server_id = $1 AND name = $2`, [server, name]);
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
				var responses = await this.getAll(server);
				await this.db.query(`DELETE FROM responses WHERE server_id = $1`, [server]);
				for(var response of responses) super.delete(`${server}-${response.name}`);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new ResponseStore(bot, db);