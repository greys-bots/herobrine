module.exports = {
	getConfig: async function(bot, server){
		return new Promise((res)=> {
			bot.db.query(`SELECT * FROM configs WHERE server_id=?`,[server], {
				server_id: String,
				prefix: String,
				welcome: val => val ? JSON.parse(val) : null,
				autoroles: val => val ? JSON.parse(val) : null,
				disabled: val => val ? JSON.parse(val) : null,
				opped: String,
				feedback: val => val ? JSON.parse(val) : null,
				logged: val => val ? JSON.parse(val) : null,
				autopin: Number
			},(err,rows)=>{
				if(err){
					console.log(err)
					res(undefined);
				} else res(rows[0])
			})
		})
	},
	createConfig: async (bot, server, data = {}) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO configs (server_id, prefix, welcome, autoroles,
						  disabled, opped, feedback, logged, autopin)
						  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
						 [server, data.prefix || "", data.welcome || {}, data.autoroles || "",
						 data.disabled || {}, data.opped || "", data.feedback || {},
						 data.logged || [], data.autopin || 2],
			(err,rows)=>{
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateConfig: async function(bot, server, data) {
		var config = await bot.utils.getConfig(bot, server);
		return new Promise((res)=> {
			if(config) {
				bot.db.query(`UPDATE configs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=?`,[...Object.values(data), server], (err, rows)=> {
					if(err) {
						console.log(err);
						res(false)
					} else res(true)
				})
			} else {
				bot.db.query(`INSERT INTO configs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
							 [server, data.prefix || "", data.welcome || {}, data.autoroles || "",
							 data.disabled || {}, data.opped || "", data.feedback || {},
							 data.logged || [], data.autopin || 2, data.aliases || []],
				(err,rows)=>{
					if(err) {
						console.log(err);
						res(false);
					} else res(true);
				})
			}
		})
	}
}