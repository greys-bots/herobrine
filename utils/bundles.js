module.exports = {
	getBundles: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM bundles WHERE server_id=?`,[server], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: val => val ? JSON.parse(val) : null,
				assignable: Boolean
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows);
			})
		})
	},
	getBundlesByRole: async (bot, server, role) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM bundles WHERE server_id=? AND roles LIKE ?`,[server, `%"${role}"%`], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: val => val ? JSON.parse(val) : null,
				assignable: Boolean
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows);
			})
		})
	},
	getBundle: async (bot, server, name) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM bundles WHERE server_id=? AND hid=?`,[server, hid], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: val => val ? JSON.parse(val) : null,
				assignable: Boolean
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0]);
			})
		})
	},
	addBundle: async (bot, server, hid, name, description, roles, assignable) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO bundles (hid, server_id, name, description, roles, assignable) VALUES (?,?,?,?,?)`, [hid, server, name, description, roles, assignable], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateBundle: async (bot, server, hid, data) => {
		return new Promise(res => {
			bot.db.query(`UPDATE bundles SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=? AND hid=?`, [...Object.values(data), server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteBundle: async (bot, server, hid) => {
		return new Promise(async res => {
		bot.db.query(`DELETE FROM bundles WHERE server_id = ? AND hid = ?`,[server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			});
		})
	},
	deleteBundles: async (bot, server) => {
		return new Promise(async res => {
			bot.db.query(`DELETE FROM bundles WHERE server_id = ?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true)
			});
		})
	}
}