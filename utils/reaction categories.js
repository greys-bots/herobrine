module.exports = {
	getReactionCategories: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=?`,[server], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse,
				posts: JSON.parse
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows);
				}
			})
		})
	},
	createReactionCategory: async (bot, hid, server, name, description) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO reactcategories (hid, server_id, name, description, roles, posts) VALUES (?,?,?,?,?,?)`,
				[hid, server, name, description, [], []], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	getReactionCategory: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reactcategories WHERE server_id=? AND hid=?`,[server, hid], {
				id: Number,
				hid: String,
				server_id: String,
				name: String,
				description: String,
				roles: JSON.parse,
				posts: JSON.parse
			}, (err, rows)=>{
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0]);
				}
			})
		})
	},
	getReactionCategorieswithRole: async (bot, server, role) => {
		console.log("grabbing categories...")
		return new Promise(async res => {
			var categories = await bot.utils.getReactionCategories(bot, server);
			if(categories) categories = categories.filter(c => c.roles.includes(role));
			if(categories) res(categories);
			else res(undefined);
		})
	},
	updateReactionCategory: async (bot, server, hid, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE reactcategories SET ?=? WHERE server_id = ? AND hid = ?`,[key, val, server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateReactionCategories: async (bot, server, hids, action, data) => {
		return new Promise(async res => {
			for(var i = 0; i < hids.length; i++) {
				var cat = await bot.utils.getReactionCategory(bot, server, hids[i]);
				if(action && action == "remove") {
					cat.roles = cat.roles.filter(x => x != data);
					bot.db.query(`UPDATE reactcategories SET roles = ? WHERE server_id = ? AND hid = ?`,[cat.roles, server, hids[i]]);
				}
			}
		})
	},
	deleteReactionCategory: async (bot, id, categoryid) => {
		return new Promise(async res => {
			var category = await bot.utils.getReactionCategory(bot, id, categoryid);
			if(!category) return res("true");
			console.log(category);
			category.posts.map(async p => {
				var post = await bot.utils.getReactPost(bot, id, p);
				console.log(post);
				if(!post) return null;
				try {
					bot.deleteMessage(post.channel_id, post.message_id);
				} catch(e) {
					console.log(e)
				}
				bot.db.query(`DELETE FROM reactposts WHERE server_id=? AND message_id=?`,[id, p]);
			})
			bot.db.query(`DELETE FROM reactcategories WHERE server_id=? AND hid=?`,[id, categoryid]);
			res(true);
		})
	}
}