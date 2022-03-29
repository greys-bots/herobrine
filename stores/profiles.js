const KEYS = [
	'id',
	'user_id',
	'title',
	'bio',
	'color',
	'badges',
	'level',
	'exp',
	'cash',
	'daily',
	'disabled'
]

const PATCHABLE = KEYS.slice(2);

class Profile {
	level = 1;
	exp = 0;
	name = "unnamed";
	description = "(not set)";

	constructor(store, data) {
		this.store = store;
		for(var k of KEYS)
			if(data[k] !== null && data[k] !== undefined)
				this[k] = data[k];

		this.level = parseInt(this.level);
		this.exp = parseInt(this.exp);
		this.cash = parseInt(this.cash);
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

class ProfileStore {
	constructor(bot, db) {
		this.db = db;
		this.bot = bot;
		this.expGiven = new Set();
	}

	async init() {
		await this.db.query(`
			CREATE TABLE IF NOT EXISTS profiles (
				id 			SERIAL PRIMARY KEY,
				user_id		TEXT,
				title		TEXT,
				bio			TEXT,
				color		TEXT,
				badges		JSONB,
				level		BIGINT,
				exp			BIGINT,
				cash		BIGINT,
				daily		TIMESTAMPTZ,
				disabled	BOOLEAN
			);
		`)
	}

	async create(user, data = {}) {
		try {
			this.db.query(`INSERT INTO profiles (
				user_id,
				title,
				bio,
				color,
				badges,
				level,
				exp,
				cash,
				daily,
				disabled
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
			[user, data.title, data.bio,
			 data.color, data.badges, data.level || 1, 
			 data.exp || 0, data.cash || 0, data.daily,
			 data.disabled || false])
		} catch(e) {
			console.error(e.message);
			return Promise.reject(e.message);
		}

		return await this.get(user);
	}

	async get(user) {
		try {
			var data = await this.db.query(`SELECT * FROM profiles WHERE user_id = $1`, [user]);
		} catch(e) {
			return Promise.reject(e.message)
		}

		if(data.rows?.[0]) return new Profile(this, data.rows[0]);
		else return new Profile(this, {user_id: user});
	}

	async getID(id) {
		try {
			var data = await this.db.query(`SELECT * FROM profiles WHERE id = $1`,[id]);
		} catch(e) {
			return Promise.reject(e.message)
		}

		if(data.rows?.[0]) return new Profile(this, data.rows[0]);
		else return new Profile(this, {});
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`
				UPDATE profiles SET ${Object.keys(data).map((k, i) => k+'=$' + (i + 2)).join(",")}
				WHERE id=$1`,
			[id, ...Object.values(data)])
		} catch(e) {
			return Promise.reject(e.message)
		}

		return await this.getID(id);
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM profiles WHERE id = $1`, [id])
		} catch(e) {
			return Promise.reject(e.message);
		}

		return;
	}

	async handleExperience(user) {
		return new Promise(async (res, rej) => {
			if(this.expGiven.has(user)) return res({});
			var profile = await this.get(user);
			var amount = Math.floor(Math.random() * 8) + 3; //for some variation
			var data = {};
			var nextLevel = Math.pow(profile.level, 2) + 100;
			if(profile.exp + amount >= nextLevel) {
				profile.exp = profile.exp + amount - nextLevel;
				profile.level += 1;
				if(!profile.disabled) data.message = `Congrats $USER, you're now level ${profile.level}!`
			} else profile.exp += amount;

			try {
				await profile.save();
			} catch(e) {
				console.log(e);
				return rej(e);
			}
			this.expGiven.add(user);
			setTimeout(()=> this.expGiven.delete(user), 10000); //ratelimit/cooldown
			res(data);
		})
	}
}

module.exports = {
	Profile,
	store: (bot, db) => new ProfileStore(bot, db)
}