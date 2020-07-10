const {Collection} = require("discord.js");

class RoleStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async init() {
		this.bot.on('guildRoleDelete', async (guild, role) => {
			await this.delete(guild.id, role.id);
		})
	}

	async create(server, role, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO roles (
					server_id,
					role_id,
					description,
					assignable
				) VALUES ($1,$2,$3,$4)`,
				[server, role, data.description, data.assignable || false])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, role));
		})
	}

	async index(server, role, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO roles (
					server_id,
					role_id,
					description,
					assignable
				) VALUES ($1,$2,$3,$4)`,
				[server, role, data.description, data.assignable || false])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, role, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var srole = super.get(`${server}-${role}`);
				if(srole) return res(srole);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM roles WHERE server_id = $1 AND role_id = $2`,[server, role]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			var guild = this.bot.guilds.find(g => g.id == server);
			if(!guild) return rej("Couldn't get guild");
			
			if(data.rows && data.rows[0]) {
				srole = guild.roles.find(r => r.id == data.rows[0].role_id);
				if(srole) data.rows[0].raw = srole;
				this.set(`${server}-${role}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM roles WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			var guild = this.bot.guilds.find(g => g.id == server);
			if(!guild) return rej("Couldn't get guild");

			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					var role = guild.roles.find(r => r.id == data.rows[i].role_id);
					if(role) data.rows[i].raw = role;
				}
				res(data.rows)
			} else res(undefined);
		})
	}

	async getByIDs(server, ids) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM roles WHERE server_id = $1 AND role_id = ANY($2)`,[server, ids]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			var guild = this.bot.guilds.find(g => g.id == server);
			if(!guild) return rej("Couldn't get guild");
			
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					var role = guild.roles.find(r => r.id == data.rows[i].role_id);
					if(role) data.rows[i].raw = role;
				}
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, role, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE roles SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND role_id = $2`,[server, role, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(server, role, true));
		})
	}

	async delete(server, role) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM roles WHERE server_id = $1 AND role_id = $2`, [server, role]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${role}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var roles = await this.getAll(server);
				await this.db.query(`DELETE FROM roles WHERE server_id = $1`, [server]);
				for(var role of roles) super.delete(`${server}-${role.role_id}`)
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async deleteByIDs(server, ids) {
		return new Promise(async (res, rej) => {
			try {
				var roles = await this.getByIDs(server, ids);
				await this.db.query(`DELETE FROM roles WHERE server_id = $1 AND role_id = ANY($2)`, [server, ids]);
				for(var role of roles) super.delete(`${server}-${role.role_id}`)
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new RoleStore(bot, db);