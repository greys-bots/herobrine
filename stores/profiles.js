const KEYS = {
	id: { },
	user_id: { },
	title: {
		patch: true,
		test: (v) => v.length <= 100,
		err: "Title must be 100 characters or less"
	},
	bio: {
		patch: true,
		test: (v) => v.length <= 2000,
		err: "Bio must be 2000 characters or less"
	},
	color: {
		patch: true
	},
	badges: {
		patch: true
	},
	level: {
		patch: true
	},
	exp: {
		patch: true
	},
	cash: {
		patch: true
	},
	daily: {
		patch: true
	},
	disabled: {
		patch: true
	}
}

class Profile {
	level = 1;
	exp = 0;
	name = "unnamed";
	description = "(not set)";

	constructor(store, data) {
		this.store = store;
		for(var k in KEYS)
			if(data[k] !== null && data[k] !== undefined)
				this[k] = data[k];

		this.level = parseInt(this.level);
		this.exp = parseInt(this.exp);
		this.cash = parseInt(this.cash);
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

		this.bot.on('messageCreate', async (msg) => {
			if(msg.author.bot) return;

			var lvlup;
			try {
				lvlup = await this.handleExperience(msg.author.id);
			} catch(e) {
				await msg.channel.send(`Error while handling experience: ${e.message ?? e}`);
			}
			if(lvlup.message) await msg.channel.send(lvlup.message.replace("$USER", msg.author.username));
		})
	}

	async create(user, data = {}) {
		try {
			var obj = await (new Profile(this, data).verify());
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
			[user, obj.title, obj.bio,
			 obj.color, obj.badges, obj.level || 1, 
			 obj.exp || 0, obj.cash || 0, obj.daily,
			 obj.disabled || false])
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