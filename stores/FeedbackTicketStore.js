const {Collection} = require("discord.js");

class FeedbackTicketStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async create(hid, server, sender, message, anon) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO feedback (
					hid,
					server_id,
					sender_id,
					message,
					anon
				) VALUES ($1,$2,$3,$4,$5)`,
				[hid, server, sender, message, anon || false]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, hid));
		})
	}

	async index(hid, server, sender, message, anon) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO feedback (
					hid,
					server_id,
					sender_id,
					message,
					anon
				) VALUES ($1,$2,$3,$4,$5)`,
				[hid, server, sender, message, anon || false]);
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
				var ticket = super.get(`${server}-${hid}`);
				if(ticket) return res(ticket);
			}

			try {
				var data = await this.db.query(`SELECT * FROM feedback WHERE server_id = $1 AND hid = $2`,[server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(`${server}-${hid}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM feedback WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async getByUser(server, user) {
		return new Promise(async (res, rej) => {	
			try {
				var data = await this.db.query(`SELECT * FROM feedback WHERE server_id = $1 AND sender_id = $2 AND anon <> $3`, [server, user, true]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);	
		})
	}

	async search(server, query = {}) {
		return new Promise(async (res, rej) => {
			var tickets;
			try {
				if(query.sender_id) tickets = await this.getByUser(server, query.sender_id);
				else tickets = await this.getAll(server);
			} catch(e) {
				return rej(e)
			}

			if(query.message) tickets = tickets.filter(t => t.message.toLowerCase().includes(query.message.toLowerCase()));

			if(tickets[0]) res(tickets);
			else res(undefined);
		})
	}

	async update(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE feedback SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND hid = $2`,[server. hid, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(server, hid, true));
		})
	}

	async delete(server, hid) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM feedback WHERE server_id = $1 AND hid = $2`, [server, hid]);
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
				var tickets = await this.getAll(server);	
			} catch(e) {
				return rej(e);
			}

			try {
				await this.db.query(`DELETE FROM feedback WHERE server_id = $1 AND hid = $2`, [server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			for(ticket of tickets) super.delete(`${server}-${ticket.hid}`);
			res();
		})
	}
}

module.exports = (bot, db) => new FeedbackTicketStore(bot, db);