const KEYS = [
	'id',
	'server_id',
	'prefix',
	'autoroles',
	'disabled',
	'opped',
	'backdoor'
]

const PATCHABLE = KEYS.slice(2);

class Config {
	constructor(store, data) {
		this.store = store;
		for(var k of KEYS) this[k] = data[k];
	}

	async fetch() {
		var data = await this.store.getID(this.id);
		for(var k of KEYS) this[k] = data[k];

		return this;
	}

	async save() {
		var obj = {};
		for(var k of PATCHABLE) {
			obj[k] = this[k];
		}

		var data;
		if(this.id) data = await this.store.update(this.id, obj);
		else data = await this.store.create(this.server_id, obj);
		for(var k of KEYS) this[k] = data[k];
		return this;
	}

	async delete() {
		await this.store.delete(this.id);
	}
}

class ConfigStore {
	constructor(bot, db) {
		this.db = db;
		this.bot = bot;
	}

	async create(server, data = {}) {
		try {
			await this.db.query(`INSERT INTO configs (
				server_id,
				prefix,
				autoroles,
				disabled,
				opped,
				backdoor
			) VALUES ($1,$2,$3,$4,$5,$6)`,
			[server, data.prefix, data.autoroles, 
			 data.disabled, data.opped, data.backdoor])
		} catch(e) {
			return Promise.reject(e.message)
		}

		return await this.get(server)
	}

	async get(server) {
		try {
			var data = await this.db.query(`SELECT * FROM configs WHERE server_id = $1`,[server]);
		} catch(e) {
			return Promise.reject(e.message)
		}

		if(data.rows?.[0]) return new Config(this, data.rows[0]);
		else return new Config(this, {server_id: server});
	}

	async getID(id) {
		try {
			var data = await this.db.query(`SELECT * FROM configs WHERE id = $1`,[id]);
		} catch(e) {
			return Promise.reject(e.message)
		}

		if(data.rows?.[0]) return new Config(this, data.rows[0]);
		else return new Config(this, {});
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`
				UPDATE configs SET ${Object.keys(data).map((k, i) => k+'=$' + (i + 2)).join(",")}
				WHERE id = $1`,
			[id, ...Object.values(data)])
		} catch(e) {
			return Promise.reject(e.message)
		}

		return await this.getID(id, true);
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM configs WHERE id = $1`, [id])
		} catch(e) {
			return Promise.reject(e.message);
		}

		return;
	}
}

module.exports = {
	Config,
	store: (bot, db) => new ConfigStore(bot, db)
}