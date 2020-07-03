const {Collection} = require("discord.js");

class StarboardStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(server, channel, emoji, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO starboards (
					server_id,
					channel_id,
					emoji,
					override,
					tolerance
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, channel, emoji, data.override || false, data.tolerance]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, channel));
		})
	}

	async index(server, channel, emoji, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO starboards (
					server_id,
					channel_id,
					emoji,
					override,
					tolerance
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, channel, emoji, data.override || false, data.tolerance]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, channel, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var starboard = super.get(`${server}-${channel}`);
				if(starboard) return res(starboard);
			}

			try {
				var data = await this.db.query(`
					SELECT starboards.*, (
						SELECT COUNT(*) FROM starred_messages
						WHERE channel_id = starboards.channel_id
					) AS message_count FROM starboards WHERE server_id = $1 AND channel_id = $2`,
					[server, channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				this.set(`${server}-${channel}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByEmoji(server, emoji) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`
					SELECT starboards.*, (
						SELECT COUNT(*) FROM starred_messages
						WHERE channel_id = starboards.channel_id
					) AS message_count FROM starboards WHERE server_id = $1 AND emoji = $2`,
					[server, emoji]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`
					SELECT starboards.*, (
						SELECT COUNT(*) FROM starred_messages
						WHERE channel_id = starboards.channel_id
					) AS message_count FROM starboards WHERE server_id = $1`,
					[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, channel, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE starboards SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND channel_id = $2`,[server, channel, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(server, channel, true));
		})
	}

	async delete(server, channel) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM starboards WHERE server_id = $1 AND channel_id = $2`, [server, channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${channel}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var starboards = await this.getAll(server);
				await this.db.query(`DELETE FROM starboards WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			for(starboard of starboards) super.delete(`${server}-${starboard.channel_id}`);
			res();
		})
	}
}

module.exports = (bot, db) => new StarboardStore(bot, db);