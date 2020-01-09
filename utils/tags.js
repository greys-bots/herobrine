module.exports = {
	getTags: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM responses WHERE server_id = ?`, [server], {
				id: Number,
				server_id: String,
				name: String,
				value: function(val) {
					if(val && val.startsWith("[") && val.endsWith("]")) return JSON.parse(val);
					else if(val) return val;
					else return undefined;
				}
			}, (err, rows) => {
				if(!rows[0]) {
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	getTag: async (bot, server, name) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM responses WHERE server_id = ? AND name = ?`, [server, name], {
				id: Number,
				server_id: String,
				name: String,
				value: function(val) {
					console.log(val);
					if(val && val.startsWith("[") && val.endsWith("]")) return JSON.parse(val);
					else if(val) return val;
					else return undefined;
				}
			}, (err, rows) => {
				if(rows[0]) {
					console.log(rows[0].value)
					res(rows[0]);
				} else {
					res(undefined);
				}
			})
		})
	},
	createTag: async (bot, server, name, value) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO responses (server_id, name, value) VALUES (?,?,?)`,[server, name, value], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteTag: async (bot, server, name) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM responses WHERE server_id = ? AND name = ?`,[server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateTag: async (bot, server, name, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE responses SET ?=? WHERE server_id = ? AND name = ?`,[key, val, server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	}
}