module.exports = {
	getWelcomeConfig: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM welcome_configs WHERE server_id = ?`, [server], {
				id: Number,
				server_id: String,
				preroles: val => val ? JSON.parse(val) : null,
				postroles: val => val ? JSON.parse(val) : null,
				channel: String,
				message: String,
				enabled: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0])
			})
		})
	},
	updateWelcomeConfig: async (bot, server, data) => {
		var config = await bot.utils.getWelcomeConfig(bot, server);
		return new Promise((res)=> {
			if(config) {
				bot.db.query(`UPDATE welcome_configs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=?`,[...Object.values(data), server], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else res(true)
				})
			} else {
				bot.db.query(`INSERT INTO welcome_configs (server_id, preroles, postroles, channel, message, enabled) VALUES (?, ?, ?, ?, ?, ?)`,
							 [server, data.preroles || [], data.postroles || [], data.channel || "", data.message || "", data.enabled || false],
				(err,rows)=>{
					if(err) {
						console.log(err);
						res(false);
					} else res(true);
				})
			}
		})
	},
	deleteWelcomeConfig: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM welcome_configs WHERE server_id = ?`, [server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	}
}