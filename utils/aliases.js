module.exports = {
	getAliases: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM aliases WHERE server_id = ?`, [server], {
				id: Number,
				server_id: String,
				name: String,
				command: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows);
			})
		})
	},
	getAlias: async (bot, server, alias) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM aliases WHERE server_id = ? AND name = ?`, [server, alias], {
				id: Number,
				server_id: String,
				name: String,
				command: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0]);
			})
		})
	},
	getAliasByCommand: async (bot, server, command) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM aliases WHERE server_id = ? AND command = ?`, [server, command], {
				id: Number,
				server_id: String,
				name: String,
				command: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0]);
			})
		})
	},
	addAlias: async (bot, server, name, command) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO aliases (server_id, name, command) VALUES (?,?,?)`, [server, name, command], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateAlias: async (bot, server, name, data = {}) => {
		return new Promise(res => {
			bot.db.query(`UPDATE aliases SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id = ? AND name = ?`, [...Object.values(data), server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	}
}