module.exports = {
	getStrikes: async (bot, server, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM strikes WHERE server_id = ? AND user_id = ?`, [server, user], {
				id: Number,
				hid: String,
				server_id: String,
				user_id: String,
				reason: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res(rows);
					else res(undefined);
				}
			})
		})
	},
	getAllStrikes: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM strikes WHERE server_id = ?`, [server], {
				id: Number,
				hid: String,
				server_id: String,
				user_id: String,
				reason: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res(rows);
					else res(undefined);
				}
			})
		})
	},
	getStrike: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM strikes WHERE server_id = ? AND hid = ?`, [server, hid], {
				id: Number,
				hid: String,
				server_id: String,
				user_id: String,
				reason: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	addStrike: async (bot, server, user, reason) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO strikes (hid, server_id, user_id, reason) VALUES (?,?,?,?)`,
				[bot.utils.genCode(4, bot.strings.codestab), server, user, reason], (err, rows) => {
					if(err) {
						console.log(err);
						res(false)
					} else res(true);
				})
		})
	},
	deleteStrike: async (bot, server, user, hid) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM strikes WHERE server_id = ? AND user_id = ? AND hid = ?`,[server, user, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	},
	deleteAllStrikes: async (bot, server, user) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM strikes WHERE server_id = ? AND user_id = ?`,[server, user], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	}
}