const {Collection} = require("discord.js");

class FeedbackConfigStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO feedback_configs (
					server_id,
					channel_id,
					anon
				) VALUES ($1,$2,$3)`,
				[server, data.channel_id || "", data.anon || false]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}

			res(await this.get(server));
		})
	}

	async index(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO feedback_configs (
					server_id,
					channel_id,
					anon
				) VALUES ($1,$2,$3)`,
				[server, data.channel_id || "", data.anon || false]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}

			res();
		})
	}

	async get(server, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var config = super.get(server);
				if(config) return res(config);
			}

			try {
				var data = await this.db.query(`SELECT * FROM feedback_configs WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(server, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async update(server, data) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE feedback_configs SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE server_id=$1`,[server, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(server, true));
		})
	}

	async delete(server) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM feedback_configs WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(server);
			res();
		})
	}
}

module.exports = (bot, db) => new FeedbackConfigStore(bot, db);