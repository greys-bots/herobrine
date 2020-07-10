require('dotenv').config();

var dblite 	= require('dblite');
var fs 		= require('fs');
var Eris 	= require("eris-additions")(require("eris"));
var bot 	= new Eris(process.env.TOKEN, {restmode: true});

const old_db = dblite('tmp.sqlite', '-header');

async function migrate() {
	return new Promise(async (res, rej)=> {
		const db = await require(__dirname+'/__db')(bot);

		await db.query(`BEGIN TRANSACTION`);

		old_db.query(`SELECT * FROM aliases`, {
			id: Number,
			server_id: String,
			name: String,
			command: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.alias.index(row.server_id, row.name, row.command);
				}
			}
		})

		old_db.query(`SELECT * FROM bundles`, {
			id: Number,
			hid: String,
			server_id: String,
			name: String,
			description: String,
			roles: val => val ? JSON.parse(val) : null,
			assignable: val => val ? Boolean(val) : false
		}, async (err, rows)=>{
			if(err) {
				console.log(err);
				res(undefined);
			} else if(rows) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.bundles.index(row.hid, row.server_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM configs`, {
			id: Number,
			server_id: String,
			prefix: String,
			disabled: val => val ? JSON.parse(val) : null,
			opped: val => val ? JSON.parse(val) : null,
			feedback: val => val ? JSON.parse(val) : null,
			logged: val => val ? JSON.parse(val) : null,
			autopin: Number
		}, async (err,rows)=>{
			if(err){
				console.log(err)
				res(undefined);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					if(row.feedback) bot.stores.feedbackConfigs.index(row.server_id, row.feedback);

					await bot.stores.configs.index(row.server_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM commands`, {
			id: Number,
			server_id: String,
			name: String,
			actions: val => val ? JSON.parse(val) : null,
			target: String,
			del: Boolean
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.customCommands.index(row.server_id, row.name, row);
				}
			}
		})

		old_db.query(`SELECT * FROM feedback`, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.feedbackTickets.index(row.hid, row.server_id, row.sender_id, row.message, row.anon);
				}
			}
		})

		old_db.query(`SELECT * FROM notes`, {
			id: Number,
			hid: String,
			user_id: String,
			title: String,
			body: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				res(undefined);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.notes.index(row.hid, row.user_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM polls`, {
			id: Number,
			hid: String,
			server_id: String,
			channel_id: String,
			message_id: String,
			user_id: String,
			title: String,
			description: String,
			choices: JSON.parse,
			active: Boolean,
			start_time: Date,
			end_time: Date
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				res(undefined);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.polls.index(row.hid, row);
				}
			}
		})

		old_db.query(`SELECT * FROM profiles`, {
			id: Number,
			user_id: String,
			title: String,
			bio: String,
			color: String,
			badges: val => val ? JSON.parse(val) : null,
			lvl: Number,
			exp: Number,
			cash: Number,
			daily: Number,
			disabled: Boolean
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				res(undefined);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.profiles.index(row.user_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM reactcategories`, {
			id: Number,
			hid: String,
			server_id: String,
			name: String,
			description: String,
			roles: val => val ? JSON.parse(val) : null,
			posts: val => val ? JSON.parse(val) : null
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.reactCategories.index(row.server_id, row.hid, row);
				}
			}
		})

		old_db.query(`SELECT * FROM reactposts`, {
			id: Number,
			server_id: String,
			channel_id: String,
			message_id: String,
			roles: val => val ? JSON.parse(val) : null,
			page: Number
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.reactPosts.index(row.server_id, row.channel_id, row.message_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM reactroles`, {
			id: Number,
			server_id: String,
			role_id: String,
			emoji: String,
			description: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.reactRoles.index(row.server_id, row.role_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM reminders`, {
			id: Number,
			hid: String,
			user_id: String,
			note: String,
			time: Date,
			recurring: Boolean,
			interval: val => val ? JSON.parse(val) : null
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				res(undefined);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.reminders.index(row.hid, row.user_id, row);
				}
			}
		})

		old_db.query(`SELECT * FROM responses`, {
			id: Number,
			server_id: String,
			name: String,
			value: function(val) {
				console.log(val);
				if(val && val.startsWith("[") && val.endsWith("]")) return JSON.parse(val);
				else if(val) return val;
				else return null;
			}
		}, async (err, rows) => {
			if(rows && rows[0]) {
				console.log(rows[0].value)
				res(rows[0]);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.responses.index(row.server_id, row.name, row);
				}
			}
		})

		old_db.query(`SELECT * FROM starboards`, {
			id: Number,
			server_id: String,
			channel_id: String,
			emoji: String,
			override: Boolean,
			tolerance: Number
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.starboards.index(row.server_id, row.channel_id, row.emoji, row);
				}
			}
		});

		old_db.query(`SELECT * FROM starred_messages`, {
			id: Number,
			server_id: String,
			channel_id: String,
			message_id: String,
			emoji: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				rej(err.message);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.starPosts.index(row.server_id, row.channel_id, row.message_id, row);
				}
			}
		});

		old_db.query(`SELECT * FROM strikes`, {
			id: Number,
			hid: String,
			server_id: String,
			user_id: String,
			reason: String
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				res(undefined);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.strikes.index(row.hid, row.server_id, row.user_id, row);
				}
			}
		});

		old_db.query(`SELECT * FROM triggers`, {
			id: Number,
			hid: String,
			user_id: String,
			name: String,
			list: val => val ? JSON.parse(val) : null,
			private: Boolean
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				res(undefined);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.triggerLists.index(row.hid, row.user_id, row);
				}
			}
		});

		old_db.query(`SELECT * FROM welcome_configs`, {
			id: Number,
			server_id: String,
			preroles: val => val ? JSON.parse(val) : null,
			postroles: val => val ? JSON.parse(val) : null,
			channel: String,
			message: String,
			enabled: Boolean
		}, async (err, rows) => {
			if(err) {
				console.log(err);
				res(undefined);
			} else if(rows[0]) {
				for(var row of rows) {
					console.log(row)
					await bot.stores.welcomeConfigs.index(row.server_id, row);
				}
			}
		});
	})
}

migrate();