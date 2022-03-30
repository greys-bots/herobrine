const { welcome: STRINGS } = require('../strings');

const KEYS = {
	id: { },
	server_id: { },
	preroles: {
		patch: true
	},
	postroles: {
		patch: true
	},
	channel: {
		patch: true
	},
	message: {
		patch: true,
		test: (v) => v.length <= 1000,
		err: "Message must be 1000 characters or less"
	},
	enabled: {
		patch: true
	}
}

class WelcomeConfig {
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

	buildEmbed() {
		return {
			title: 'Welcome config',
			fields: [
				{
					name: 'Message',
					value: this.message ?? "(not set)"
				},
				{
					name: 'Channel',
					value: this.channel ? `<#${this.channel}>` : "(not set)"
				},
				{
					name: 'Join roles',
					value: (
						this.preroles?.length ?
						this.preroles.map(r => `<@&${r}>`).join("\n") :
						"(not set)"
					)
				},
				{
					name: 'Command roles',
					value: (
						this.postroles?.length ?
						this.postroles.map(r => `<@&${r}>`).join("\n") :
						"(not set)"
					)
				},
			],
			footer: { text: `Config is currently ${this.enabled ? 'enabled' : 'disabled'}` }
		}
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

class WelcomeConfigStore {
	constructor(bot, db) {
		this.db = db;
		this.bot = bot;
	}

	async init() {
		await this.db.query(`
			CREATE TABLE IF NOT EXISTS welcome_configs (
				id 			SERIAL PRIMARY KEY,
				server_id	TEXT,
				preroles	TEXT[],
				postroles	TEXT[],
				channel 	TEXT,
				message 	TEXT,
				enabled		BOOLEAN
			);
		`)

		this.bot.on('guildMemberAdd', (member) => this.handleWelcome(member))
	}

	async create(server, data = {}) {
		try {
			var obj = await (new WelcomeConfig(this, data).verify());
			await this.db.query(`INSERT INTO welcome_configs (
				server_id,
				preroles,
				postroles,
				channel,
				message,
				enabled
			) VALUES ($1,$2,$3,$4,$5,$6)`,
			[server, obj.preroles, obj.postroles, 
			 obj.channel, obj.message, obj.enabled])
		} catch(e) {
			return Promise.reject(e.message)
		}

		return await this.get(server)
	}

	async get(server) {
		try {
			var data = await this.db.query(`SELECT * FROM welcome_configs WHERE server_id = $1`,[server]);
		} catch(e) {
			return Promise.reject(e.message)
		}

		if(data.rows?.[0]) return new WelcomeConfig(this, data.rows[0]);
		else return new WelcomeConfig(this, {server_id: server});
	}

	async getID(id) {
		try {
			var data = await this.db.query(`SELECT * FROM welcome_configs WHERE id = $1`,[id]);
		} catch(e) {
			return Promise.reject(e.message)
		}

		if(data.rows?.[0]) return new WelcomeConfig(this, data.rows[0]);
		else return new WelcomeConfig(this, {});
	}

	async update(id, data = {}) {
		try {
			await this.db.query(`
				UPDATE welcome_configs SET ${Object.keys(data).map((k, i) => k+'=$' + (i + 2)).join(",")}
				WHERE id = $1`,
			[id, ...Object.values(data)])
		} catch(e) {
			return Promise.reject(e.message)
		}

		return await this.getID(id, true);
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM welcome_configs WHERE id = $1`, [id])
		} catch(e) {
			return Promise.reject(e.message);
		}

		return;
	}

	async handleWelcome(member) {
		if(member.user.bot) return;
		var { guild } = member;
		var cfg = await this.get(guild.id);
		if(!cfg?.enabled) return;
		if(!cfg.channel) return;
		if(cfg.message) {
			var msg = cfg.message;
			for(var k in STRINGS) {
				msg = msg.replace(k, STRINGS[k](member, guild),"g");
			}

			var channel = await guild.channels.fetch(cfg.channel);
			await channel.send(msg);
		}
		if(cfg.preroles) {
			var invalid = [];
			for(var i = 0; i < cfg.preroles.length; i++) {
				if(guild.roles.cache.find(rl => rl.id == cfg.preroles[i])){
					await member.roles.add(cfg.preroles[i]);
				} else {
					invalid.push(cfg.preroles[i])
				}
			}

			if(invalid[0]) {
				cfg.preroles = cfg.preroles.filter(x => !invalid.includes(x));
				await cfg.save();
			}
		}
	}
}

module.exports = {
	WelcomeConfig,
	store: (bot, db) => new WelcomeConfigStore(bot, db)
}