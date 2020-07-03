const {Collection} = require("discord.js");

class BundleStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async init() {
		this.bot.on('guildRoleDelete', async (guild, role) => {
			var bundles = await this.getByRole(guild.id, role.id);
			if(!bundles || !bundles[0]) return;
			for(var i = 0; i < bundles.length; i++)
				await this.update(guild.id, bundles[i].hid, {roles: bundles[i].roles.filter(x => x != role.id)})
		})
	}

	async create(server, name, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO bundles (
					server_id,
					name,
					description,
					roles,
					assignable
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, name, data.roles || [], data.assignable || false])
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
				await this.db.query(`INSERT INTO bundles (
					server_id,
					name,
					description,
					roles,
					assignable
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, name, data.roles || [], data.assignable || false])
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
				var bundle = super.get(`${server}-${name}`);
				if(bundle) return res(bundle);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM bundles WHERE server_id = $1 AND name = $2`,[server, name]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			var guild = this.bot.guilds.find(g => g.id == server);
			if(!guild) return rej("Couldn't get guild");
			
			if(data.rows && data.rows[0]) {
				var roles = [];
				for(var role of data.rows[0].roles) {
					var rl = guild.roles.find(r => r.id == role);
					if(rl) roles.push(rl);
				}

				if(roles.length < data.rows[0].roles.length) await this.update(server, name, {roles: roles.map(r => r.id)});
				data.rows[0].roles = roles;

				this.set(`${server}-${name}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM bundles WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			var guild = this.bot.guilds.find(g => g.id == server);
			if(!guild) return rej("Couldn't get guild");
			
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					var roles = [];
					for(var role of data.rows[i].roles) {
						var rl = guild.roles.find(r => r.id == role);
						if(rl) roles.push(rl);
					}

					if(roles.length < data.rows[i].roles.length) await this.update(server, data.rows[i].name, {roles: roles.map(r => r.id)});
					data.rows[i].roles = roles;
				}

				res(data.rows)
			} else res(undefined);
		})
	}

	async getByRole(server, role) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM bundles WHERE server_id = $1 AND $2 = ANY(roles)`,[server, role]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			var guild = this.bot.guilds.find(g => g.id == server);
			if(!guild) return rej("Couldn't get guild");
			
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					var roles = [];
					for(var role of data.rows[i].roles) {
						var rl = guild.roles.find(r => r.id == role);
						if(rl) roles.push(rl);
					}

					if(roles.length < data.rows[i].roles.length) await this.update(server, data.rows[i].name, {roles: roles.map(r => r.id)});
					data.rows[i].roles = roles;
				}

				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, name, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE bundles SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND name = $2`,[server, name, ...Object.values(data)]);
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
				await this.db.query(`DELETE FROM bundles WHERE server_id = $1 AND name = $2`, [server, name]);
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
				var bundles = await this.getAll(server);
				await this.db.query(`DELETE FROM bundles WHERE server_id = $1`, [server]);
				for(var bundle of bundles) super.delete(`${server}-${bundle.name}`);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new BundleStore(bot, db);