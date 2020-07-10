const {Collection} = require("discord.js");

class WelcomeConfigStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async init() {
		this.bot.on("guildMemberAdd", (guild, member) => this.handleWelcome(guild, member));
	}

	async create(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO welcome_configs (
					server_id,
					preroles,
					postroles,
					channel,
					message,
					enabled
				) VALUES ($1, $2, $3, $4, $5, $6)`,
				[server, data.preroles || [], data.postroles || [],
				 data.channel, data.message, data.enabled || false])
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(server));
		})
	}

	async index(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO welcome_configs (
					server_id,
					preroles,
					postroles,
					channel,
					message,
					enabled
				) VALUES ($1, $2, $3, $4, $5, $6)`,
				[server, data.preroles || [], data.postroles || [],
				 data.channel, data.message, data.enabled || false])
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res();
		})
	}

	async get(server, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var config = super.get(server);
				if(config) return res(config);
			}

			try {
				var data = await this.db.query(`SELECT * FROM welcome_configs WHERE server_id = $1`, [server])
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows && data.rows[0]) {
				this.set(server, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async update(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE welcome_configs SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE server_id = $1`,[server, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(server, true));
		})
	}

	async delete(server) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM welcome_configs WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			super.delete(server);
			res();
		})
	}

	async handleWelcome(guild, member) {
		if(member.user.bot) return;
		var cfg = await this.get(guild.id);
		if(!cfg || (cfg && !cfg.enabled)) return;
		if(!cfg.channel) return;
		if(cfg.message) {
			var msg = cfg.message;
			var keys = Object.keys(this.bot.strings.welc_strings);
			for(var i = 0; i < keys.length; i++) {
				msg = msg.replace(keys[i], eval("`"+this.bot.strings.welc_strings[keys[i]]+"`"),"g");
			}
			this.bot.createMessage(cfg.channel, msg);
		}
		if(cfg.preroles) {
			var invalid = [];
			for(var i = 0; i < cfg.preroles.length; i++) {
				if(guild.roles.find(rl => rl.id == cfg.preroles[i])){
					member.addRole(cfg.preroles[i]);
				} else {
					invalid.push(cfg.preroles[i])
				}
			}
			
			if(invalid[0]) {
				cfg.preroles = cfg.preroles.filter(x => !invalid.includes(x));
				await this.update(msg.guild.id, {preroles: cfg.preroles});
			}
		}
	}
}

module.exports = (bot, db) => new WelcomeConfigStore(bot, db);