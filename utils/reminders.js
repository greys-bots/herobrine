//date parsing inspiration: chrono-node

const KEYWORDS = [
	'in',
	'at',
	'every'
];

const MONTHS = {
	'jan\.?(?:uary)': 1,
	'feb\.?(?:ruary)': 2,
	'mar\.?(?:ch)': 3,
	'apr\.?(?:il)': 4,
	'may': 5,
	'jun\.?(?:e)': 6,
	'jul\.?(?:y)': 7,
	'aug\.?(?:ust)': 8,
	'sept?\.?(?:ember)': 9,
	'oct\.?(?:ober)': 10,
	'nov\.?(?:ember)': 11,
	'dec\.?(?:ember)': 12
}

const MONTHS_REGEX = `(?:${Object.keys(MONTHS).join('|')})`;

const NUMBERS = {
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9,
	ten: 10,
	eleven: 11,
	twelve: 12,
	thirteen: 13,
	fourteen: 14,
	fifteen: 15,
	sixteen: 16,
	seventeen: 17,
	eighteen: 18,
	ninteen: 19,
	twenty: 20,
	thirty: 30,
	forty: 40,
	fifty: 50,
	sixty: 60,
	seventy: 70,
	eighty: 80,
	ninety: 90
}

module.exports = {
	createReminder: async (bot, user, hid, note, time, recurring, interval) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO reminders (hid, user_id, note, time, recurring, interval) VALUES (?,?,?,?,?,?)`,[hid, user, note, time, recurring, interval], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	getReminderCount: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT COUNT(*) as count FROM reminders WHERE user_id=?`,[user],(err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					console.log(rows);
					res(rows[0].count)
				}
			})
		})
	},
	getReminder: async (bot, user, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reminders WHERE user_id=? AND hid=?`,[user, hid], {
				id: Number,
				hid: String,
				user_id: String,
				note: String,
				time: Date,
				recurring: Boolean,
				interval: val => val ? JSON.parse(val) : null
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows[0])
			})
		})
	},
	getReminders: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reminders WHERE user_id=?`,[user], {
				id: Number,
				hid: String,
				user_id: String,
				note: String,
				time: Date,
				recurring: Boolean,
				interval: val => val ? JSON.parse(val) : null
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows)
			})
		})
	},
	getAllReminders: async (bot) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM reminders`, {
				id: Number,
				hid: String,
				user_id: String,
				note: String,
				time: Date,
				recurring: Boolean,
				interval: val => val ? JSON.parse(val) : null
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else res(rows)
			})
		})
	},
	editReminder: async (bot, user, hid, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE reminders SET ?=? WHERE user_id=? AND hid=?`,[key, val, user, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	},
	deleteReminder: async (bot, user, hid) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM reminders WHERE user_id=? AND hid=?`,[user, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					if(bot.reminders[user+"-"+hid]) {
						bot.reminders[user+"-"+hid].cancel();
						delete bot.reminders[user+"-"+hid];
					}
					res(true);
				}
			})
		})
	},
	deleteReminders: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM reminders WHERE user_id=?`,[user], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else res(true);
			})
		})
	},
	sendReminder: async (bot, user, hid) => {
		return new Promise(async res => {
			var reminder = await bot.utils.getReminder(bot, user, hid);
			if(!reminder) return res(true);
			console.log(reminder);

			var ch = await bot.getDMChannel(user);
			if(!ch) return res(false);

			try {
				ch.createMessage(`:alarm_clock: **Reminder:** ${reminder.note}`);
			} catch(e) {
				//can't send the message, guess we give up
				//log it just in case
				console.log(e);
			}
			if(!reminder.recurring) await bot.utils.deleteReminder(bot, user, hid);
			else {
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
					await bot.utils.editReminder(bot, user, hid, "time", date.toISOString());
					delete bot.reminders[user+"-"+hid];
					bot.reminders[user+"-"+hid] = bot.scheduler.scheduleJob(date, ()=> bot.utils.sendReminder(bot, user, hid));
				} catch(e) {
					//idk what to do here honestly,
					//guess we just log the error
					//and go on our way?
					console.log(e);
				}
			}
		})
	},
	parseDate: (input) => {
		if(typeof input == "string") {
			var match = input.match(/((?:\d+?|\b\w+\s)\s?(?:mo|w|d|h|m|s))/gi);
			if(!match || !match[0]) match = input.match(/\b(mo|w|d|h|m|s)/gi);
			if(!match || !match[0]) return null;
			console.log(match);

			var parsed = {
				mo: 0,
				w: 0,
				d: 0,
				h: 0,
				m: 0,
				s: 0
			}
			var matched = false
			for(var i = 0; i < match.length; i++) {
				var section = match[i].match(/[a-z]$/i)[0];
				console.log(section);
				if(Object.keys(parsed).includes(section)) {
					if(match[i].match(/[0-9]+/gi)) {
						parsed[section] = parseInt(match[i].match(/[0-9]+/gi)[0]);
					} else {
						parsed[section] = 1;
					}
					matched = true;
				}
			}

			console.log(parsed);

			if(!matched) return null;

			var date = new Date(Date.now() + 
								(parsed.mo*30*24*60*1000) +
								(parsed.w*7*24*60*60*1000) +
								(parsed.d*24*60*60*1000) +
								(parsed.h*60*60*1000) +
								(parsed.m*60*1000) +
								(parsed.s*1000));
			console.log(date);
			return {parsed: parsed, date: date};
		} else {
			var parsed = [];
			var err = false;

			for(var i = 0; i<input.length; i++) {
				var match = input[i].match(/\b((?:\d+|\S+\s)?\s?(?:mo|w|d|h|m|s){1})/gi);
				console.log(match);
				if(!match || !match[0]) {
					err = true;
					break;
				}

				parsed.push({parsed: {mo: 0, w: 0, d: 0, h: 0, m: 0, s: 0}});

				var matched = false
				for(var j = 0; j < match.length; j++) {
					var section = match[j].match(/[a-z]/i)[0];
					if(Object.keys(parsed[i].parsed).includes(section)) {
						if(match[j].match(/[0-9]/)) {
							parsed[i].parsed[section] = parseInt(match[j].match(/[0-9]/)[0]);
						} else {
							parsed[i].parsed[section] = 1;
						}
						matched = true;
					}
				}

				parsed[i].date = new Date(Date.now() + 
									(parsed[i].parsed.mo*30*24*60*1000) +
									(parsed[i].parsed.w*7*24*60*60*1000) +
									(parsed[i].parsed.d*24*60*60*1000) +
									(parsed[i].parsed.h*60*60*1000) +
									(parsed[i].parsed.m*60*1000) +
									(parsed[i].parsed.s*1000));
			}
			console.log(err);
			if(err) return null;

			console.log(parsed);

			return parsed
		}
	}
}