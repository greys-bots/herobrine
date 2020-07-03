const {Collection} = require("discord.js");

class CommandStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(server, name, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO commands (
					server_id,
					name,
					actions,
					target,
					del
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, name, JSON.stringify( data.actions || []), data.target || "member", data.del || false]);
				//have to manually stringify JSON arrays due to bug in pg lib
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
				await this.db.query(`INSERT INTO commands (
					server_id,
					name,
					actions,
					target,
					del
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, name, JSON.stringify( data.actions || []), data.target || "member", data.del || false]);
				//have to manually stringify JSON arrays due to bug in pg lib
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
				var command = super.get(`${server}-${name}`);
				if(command) return res(command);
			}

			try {
				var data = await this.db.query(`SELECT * FROM commands WHERE server_id = $1 AND name = $2`,[server, name]);
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
				var data = await this.db.query(`SELECT * FROM commands WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);

		})
	}

	async update(server, name, data) {
		return new Promise(async (res, rej) => {
			try {
				if(data.actions) data.actions = JSON.stringify(data.actions);
				await this.db.query(`UPDATE commands SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND name = $2`,[server, name, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(`${server}-${name}`, true));
		})
	}

	async delete(server, name) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM commands WHERE server_id = $1 AND name = $2`, [server, name]);
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
				var commands = await this.getAll(server);
			} catch(e) {
				return rej(e);
			}

			try {
				await this.db.query(`DELETE FROM commands WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			for(command of commands) super.delete(`${server}-${command.name}`);
			res();
		})
	}
}

module.exports = (bot, db) => new CommandStore(bot, db);