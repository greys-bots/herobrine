const {Collection} = require("discord.js");

class ReactCategoryStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO reactcategories (
					hid,
					server_id,
					name,
					description,
					roles,
					posts,
					single,
					required
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
				[hid, server, data.name, data.description,
				data.roles || [], data.posts || [], data.single, data.required]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, hid));
		})
	}

	async index(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO reactcategories (
					hid,
					server_id,
					name,
					description,
					roles,
					posts,
					single,
					required
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
				[hid, server, data.name, data.description,
				data.roles || [], data.posts || [], data.single, data.required]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, hid, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var category = super.get(`${server}-${hid}`);
				if(category) return res(category);
			}

			try {
				var data = await this.db.query(`SELECT * FROM reactcategories WHERE server_id = $1 AND hid = $2`,[server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				var category = data.rows[0];
				category.raw_posts = category.posts;
				category.posts = (await this.bot.stores.reactPosts.getByRowIDs(server, category.posts)) || [];
				category.raw_roles = category.roles;
				category.roles = await this.bot.stores.reactRoles.getByRowIDs(server, category.roles);
				if(category.raw_posts.length < category.posts.length || category.raw_roles.length < category.roles.length) {
					category.raw_posts = category.raw_posts.filter(x => category.posts.find(p => p.id == x));
					category.raw_roles = category.raw_roles.filter(x => category.roles.filter(r => r.id == x));
					await this.update(server, hid, {posts: category.raw_posts, roles: category.raw_roles});
				}
				this.set(`${server}-${hid}`, category);
				res(category)
			} else res(undefined);
		})
	}

	async getByRole(server, role, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			try {
				var categories = await this.getAll(server);
			} catch(e) {
				return rej(e);
			}

			categories = categories.filter(c => c.roles.find(r => r.id == role) || c.raw_roles.includes(role));
			if(categories[0]) res(categories);
			else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM reactcategories WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					data.rows[i].raw_posts = data.rows[i].posts;
					data.rows[i].posts = await this.bot.stores.reactPosts.getByRowIDs(server, data.rows[i].posts);
					data.rows[i].raw_roles = data.rows[i].roles;
					data.rows[i].roles = await this.bot.stores.reactRoles.getByRowIDs(server, data.rows[i].roles);
				}
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, hid, data = {}, updatePosts = true) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE reactcategories SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND hid = $2`,[server, hid, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			var category = await this.get(server, hid, true);
			if(!category) return rej('Category not found');

			var embeds = await this.bot.utils.genReactPosts(this.bot, category.roles, {
				title: category.name,
				description: category.description,
				footer: {
					text: `Category ID: ${category.hid}${category.single ? " | You may only have one role from this category at a time" : ""}`
				}
			});

			if(updatePosts) {
				for(var post of category.posts) {
					try {
						await this.bot.stores.reactPosts.update(server, post.message_id, {...embeds[post.page], single: category.single, required: category.required});
					} catch(e) {
						return rej(e);
					}
				}
			}
				
			res(category);
		})
	}

	async delete(server, hid) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM reactcategories WHERE server_id = $1 AND hid = $2`, [server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			super.delete(`${server}-${hid}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var categories = await this.getAll(server);
				await this.db.query(`DELETE FROM reactcategories WHERE server_id = $1`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			for(category of categories) super.delete(`${server}-${category.hid}`);
			res();
		})
	}
}

module.exports = (bot, db) => new ReactCategoryStore(bot, db);