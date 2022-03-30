const KEYS = {
	id: { },
	server_id: { },
	disabled: {
		patch: true
	},
	opped: {
		patch: true
	},
	backdoor: {
		patch: true
	}
}

class Config {
	constructor(store, data) {
		this.store = store;
		for(var k in KEYS) this[k] = data[k];
	}

	async fetch() {
		var data = await this.store.getID(this.id);
		for(var k in KEYS) this[k] = data[k];

		return this;
	}

	async save() {
		var obj = await this.verify();

		var data;
		if(this.id) data = await this.store.update(this.id, obj);
		else data = await this.store.create(this.server_id, obj);
		for(var k in KEYS) this[k] = data[k];
		return this;
	}

	async delete() {
		await this.store.delete(this.id);
	}

	async verify(patch = true /* generate patch-only object */) {
		var obj = {};
		var errors = []
		for(var k in KEYS) {
			if(!KEYS[k].patch && patch) continue;
			if(this[k] == undefined) continue;
			if(this[k] == null) {
				obj[k] = this[k];
				continue;
			}

			var test = true;
			if(KEYS[k].test) test = await KEYS[k].test(this[k]);
			if(!test) {
				errors.push(KEYS[k].err);
				continue;
			}
			if(KEYS[k].transform) obj[k] = KEYS[k].transform(this[k]);
			else obj[k] = this[k];
		}

		if(errors.length) throw new Error(errors.join("\n"));
		return obj;
	}
}

class ConfigStore {
	constructor(bot, db) {
		this.db = db;
		this.bot = bot;
	}

	async init() {
		await this.db.query(`
			CREATE TABLE IF NOT EXISTS configs (
				id 			SERIAL PRIMARY KEY,
				server_id 	TEXT,
				disabled 	JSONB,
				opped 		TEXT[],
				backdoor	BOOLEAN
			);
		`);
	}

	async create(server, data = {}) {
		try {
			var obj = await (new Config(this, data).verify());
			await this.db.query(`INSERT INTO configs (
				server_id,
				disabled,
				opped,
				backdoor
			) VALUES ($1,$2,$3,$4)`,
			[server, obj.disabled, obj.opped, obj.backdoor])
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