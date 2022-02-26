const KEYS = [
	'id',
	'hid',
	'user_id',
	'title',
	'body'
];

const PATCHABLE = KEYS.slice(3);

class Note {
	constructor(store, data) {
		this.store = store;
		for(var k of KEYS)
			if(data[k] !== null && data[k] !== undefined)
				this[k] = data[k];
	}

	async fetch() {
		var data = await this.store.getID(this.id);
		for(var k of KEYS) this[k] = data[k];

		return this;
	}

	async save() {
		var obj = {};
		for(var k of PATCHABLE) obj[k] = this[k];

		var data;
		if(this.id) data = await this.store.update(this.id, obj);
		else data = await this.store.create(this.user_id, obj);
		for(var k of KEYS) this[k] = data[k];
		return this;
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
			var data = await this.db.query(`INSERT INTO notes (
				hid,
				user_id,
				title,
				body
			) VALUES (find_unique('notes'), $1, $2, $3)
			RETURNING hid;`,
			[user, data.title, data.body])
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
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
			await this.db.query(`UPDATE notes SET ${Object.keys(data).map((k, i) => k+"=$"+(i+1)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
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