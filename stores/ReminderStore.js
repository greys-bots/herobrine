const {Collection} = require("discord.js");

class ReminderStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async init() {
		this.bot.on('ready', async () => {
			var today = new Date();
			var reminders = await this.getAll();
			if(!reminders) return;
			for(var reminder of reminders) {
				var time = new Date(reminder.time);
				if(time < today) {
					await this.send(reminder.user_id, reminder.hid);
				} else {
					this.bot.reminders[reminder.user_id+"-"+reminder.hid] = this.bot.scheduler.scheduleJob(time, ()=> this.send(reminder.user_id, reminder.hid))
				}
			}
		})
	}

	async create(user, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO reminders (
					hid,
					user_id,
					note,
					time,
					recurring,
					interval
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[hid, user, data.note, data.time, data.recurring || false, data.interval])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(user, hid));
		})
	}

	async index(user, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO reminders (
					hid,
					user_id,
					note,
					time,
					recurring,
					interval
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[hid, user, data.note, data.time, data.recurring || 0, data.interval])
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(user, hid, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var reminder = super.get(`${user}-${hid}`);
				if(reminder) return res(reminder);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM reminders WHERE user_id = $1 AND hid = $2`,[user, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(`${user}-${hid}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(user) {
		return new Promise(async (res, rej) => {
			try {
				var data;
				if(user) data = await this.db.query(`SELECT * FROM reminders WHERE user_id = $1`,[user]);
				else data = await this.db.query(`SELECT * FROM reminders`); //for grabbing them all when the bot starts up
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(user, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE reminders SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE user_id = $1 AND hid = $2`,[user, hid, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(user, hid, true));
		})
	}

	async delete(user, hid) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM reminders WHERE user_id = $1 AND hid = $2`, [user, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${user}-${hid}`);
			res();
		})
	}

	async deleteAll(user) {
		return new Promise(async (res, rej) => {
			try {
				var reminders = await this.getAll(user);
				await this.db.query(`DELETE FROM reminders WHERE user_id = $1`, [user]);
				for(var reminder of reminders) super.delete(`${user}-${reminder.hid}`)
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async send(user, hid) {
		return new Promise(async (res, rej) => {
			var reminder = await this.get(user, hid);
			if(!reminder) return res();
			console.log(reminder);

			var ch = await this.bot.getDMChannel(user);
			if(!ch) return rej();

			try {
				await ch.createMessage(`:alarm_clock: **Reminder:** ${reminder.note}`);
			} catch(e) {
				//can't send the message, guess we give up
				//log it just in case
				console.log(e);
			}
			
			if(!reminder.recurring) {
				await this.delete(user, hid);
				res()
			} else {
				var today = new Date();
				var date = new Date(new Date(reminder.time).getTime() +
								   (reminder.interval.mo*30*24*60*60*1000) +
								   (reminder.interval.w*7*24*60*60*1000) +
								   (reminder.interval.d*24*60*60*1000) +
								   (reminder.interval.h*60*60*1000) +
								   (reminder.interval.m*60*1000) +
								   (reminder.interval.s*1000));

				//just in case there's a LOT of downtime for some reason
				//eg: the bot was down for 2 or 3 days, and missed
				//all the reminders for that period; this
				//catches it up to be current
				while(date < today) {
					date = new Date(date.getTime() +
								   (reminder.interval.mo*30*24*60*60*1000) +
								   (reminder.interval.w*7*24*60*60*1000) +
								   (reminder.interval.d*24*60*60*1000) +
								   (reminder.interval.h*60*60*1000) +
								   (reminder.interval.m*60*1000) +
								   (reminder.interval.s*1000));
				}

				try {
					await this.update(user, hid, {time: date.toISOString()});
					delete this.bot.reminders[user+"-"+hid];
					this.bot.reminders[user+"-"+hid] = this.bot.scheduler.scheduleJob(date, ()=> this.send(user, hid));
					res()
				} catch(e) {
					//idk what to do here honestly,
					//guess we just log the error
					//and go on our way?
					console.log(e);
					rej()
				}
			}
		})
	}
}

module.exports = (bot, db) => new ReminderStore(bot, db);