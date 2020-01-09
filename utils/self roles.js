module.exports = {
	getSelfRoles: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM roles WHERE server_id=?`,[server], {
				server_id: String,
				role_id: String,
				description: String,
				assignable: Boolean
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows);
			})
		})
	},
	getSelfRole: async (bot, server, role) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM roles WHERE server_id=? AND role_id=?`,[server, role], {
				server_id: String,
				role_id: String,
				description: String,
				assignable: Boolean
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0]);
			})
		})
	},
	addSelfRole: async (bot, server, role, description, assignable) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO roles (server_id, role_id, description, assignable) VALUES (?,?,?,?)`, [server, role, description, assignable], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateSelfRole: async (bot, server, role, data) => {
		return new Promise(res => {
			bot.db.query(`UPDATE roles SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=? AND role_id=?`, [...Object.values(data), server, role], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteSelfRole: async (bot, server, role) => {
		return new Promise(async res => {
		bot.db.query(`DELETE FROM roles WHERE server_id = ? AND role_id = ?`,[server, role], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			});
		})
	},
	deleteSelfRoles: async (bot, server, roles) => {
		return new Promise(async res => {
			bot.db.query(`DELETE FROM roles WHERE server_id = ? AND role_id IN (${roles.join(",")})`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true)
			});
		})
	},
	deleteAllSelfRoles: async (bot, server) => {
		return new Promise(async res => {
			bot.db.query(`DELETE FROM roles WHERE server_id = ?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true)
			});
		})
	}
}