const KEYS = {
	'id': { },
	'hid': { },
	'user_id': { },
	'title': {
		patch: true,
		test: (v) => v.length <= 100,
		err: "Title must be at most 100 characters"
	},
	'body': {
		patch: true,
		test: (v) => v.length <= 2000,
		err: "Body must be at most 2000 characters"
	},
};

class Note {
	constructor(store, data) {
		this.store = store;
		for(var k in KEYS)
			if(data[k] !== null && data[k] !== undefined)
				this[k] = data[k];
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
		else data = await this.store.create(this.user_id, obj);
		for(var k in KEYS) this[k] = data[k];
		return this;
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

	async delete() {
		await this.store.delete(this.id);
	}
}

class NoteStore {
	constructor(bot, db) {
		this.db = db;
		this.bot = bot;
	}

	async init() {
		await this.db.query(`
			CREATE TABLE IF NOT EXISTS notes (
				id 			SERIAL PRIMARY KEY,
				hid 		TEXT,
				user_id 	TEXT,
				title 		TEXT,
				body 		TEXT
			);
		`)
	}

	async create(user, data = {}) {
		try {
			var obj = await (new Note(this, data).verify());
			var data = await this.db.query(`INSERT INTO notes (
				hid,
				user_id,
				title,
				body
			) VALUES (find_unique('notes'), $1, $2, $3)
			RETURNING hid;`,
			[user, obj.title, obj.body])
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message ?? e);
		}

		return await this.get(user, data.rows[0].hid);
	}

	async get(user, hid) {
		try {
			var data = await this.db.query(`SELECT * FROM notes WHERE user_id = $1 AND hid = $2`, [user, hid])
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		if(data.rows && data.rows[0]) {
			return new Note(this, data.rows[0]);
		} else return new Note(this, {user_id: user});
	}

	async getID(id) {
		try {
			var data = await this.db.query(`SELECT * FROM notes WHERE id = $1`, [id])
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		if(data.rows?.[0]) return new Note(this, data.rows[0]);
		else return new Note(this, {});
	}

	async getAll(user) {
		try {
			var data = await this.db.query(`SELECT * FROM notes WHERE user_id = $1`, [user])
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		if(data.rows && data.rows[0]) {
			return data.rows.map(t => new Note(this, t));
		} else return undefined;
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`UPDATE notes SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		return await this.getID(id);
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM notes WHERE id = $1`, [id])
		} catch(e) {
			return Promise.reject(e.message);
		}

		return;
	}
	async deleteAll(user) {
		try {
			await this.db.query(`DELETE FROM notes WHERE user_id = $1`, [user])
		} catch(e) {
			return Promise.reject(e.message);
		}

		return;
	}
}

module.exports = {
	Note,
	store: (bot, db) => new NoteStore(bot, db)
}