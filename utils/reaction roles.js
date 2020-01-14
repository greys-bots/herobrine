module.exports = {
	getReactionRoles: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactroles WHERE server_id=?`,[server],(err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	getReactionRole: async (bot, server, role) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactroles WHERE server_id=? AND role_id=?`,[server, role],(err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	getReactionRolesByCategory: async (bot, server, category) => {
		var category = await bot.utils.getReactionCategory(bot, server, category);
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=? AND hid=?`,[server, category], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse
			}, async (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0] && rows[0].roles) {
						var roles = [];
						for(var i = 0; i < rows[0].roles.length; i++) {
							bot.db.query(`SELECT * FROM reactroles WHERE id=?`,[r], (err, rls)=> {
								roles[i] = rls[0]
							});
						}
						
						res(roles)
					} else {
						res(undefined);
					}

				}
			})
		})
	},
	addReactionRole: async (bot, server, role, emoji, description) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO reactroles (server_id, role_id, emoji, description) VALUES (?,?,?,?)`, [server, role, emoji, description], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteReactionRole: async (bot, id, role) => {
		return new Promise(async res => {
			var rr = await bot.utils.getReactionRole(bot, id, role);
			if(!rr) return res(true);

			bot.db.query(`DELETE FROM reactroles WHERE server_id = ? AND role_id = ?`,[id, rr.role_id], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					console.log("Deleted role")
					res(true)
				}
			});

			var cats = await bot.utils.getReactionCategorieswithRole(bot, id, rr.id);
			if(cats) {
				var scc = await bot.utils.updateReactionCategories(bot, id, cats.map(c => c.hid), "remove", rr.id);
				if(!scc) return res(false);
			}

			var posts = await bot.utils.getReactPostswithRole(bot, id, rr.role_id);
			if(posts) {
				var scc2 = await bot.utils.updateReactPosts(bot, id, posts.map(p => p.message_id), "remove", rr.role_id);
				if(!scc2) return res(false);
			}
		})
	},
	deleteReactionRoles: async (bot, server, roles) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM reactroles WHERE server_id = ? AND role_id IN (${roles.join(",")})`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true)
			});
		})
	}
}