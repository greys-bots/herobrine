// not ready yet
// module.exports = {
// 	getLogConfigs: async (bot, server) => {
// 		return new Promise(res => {
// 			bot.db.query(`SELECT * FROM logging_configs WHERE server_id = ?`, [server], {
// 				id: Number,
// 				server_id: String,
// 				channel_id: String,
// 				events: val => val ? JSON.parse(val) : null
// 			}, (err, rows) => {
// 				if(err) {
// 					console.log(err);
// 					res(undefined)
// 				} else {
// 					if(rows[0]) res(rows);
// 					else res(undefined);
// 				}
// 			})
// 		})
// 	},
// 	getLogConfig: async (bot, server, channel) => {
// 		return new Promise(res => {
// 			bot.db.query(`SELECT * FROM logging_configs WHERE server_id = ? AND channel_id = ?`, [server, channel], {
// 				id: Number,
// 				server_id: String,
// 				channel_id: String,
// 				events: val => val ? JSON.parse(val) : null
// 			}, (err, rows) => {
// 				if(err) {
// 					console.log(err);
// 					res(undefined)
// 				} else res(rows[0])
// 			})
// 		})
// 	},
// 	getLogConfigByEvent: async (bot, server, event) => {
// 		return new Promise(res => {
// 			bot.db.query(`SELECT * FROM logging_configs WHERE server_id = ? AND events LIKE ?`, [server, `"${event}"`], {
// 				id: Number,
// 				server_id: String,
// 				channel_id: String,
// 				events: val => val ? JSON.parse(val) : null
// 			}, (err, rows) => {
// 				if(err) {
// 					console.log(err);
// 					res(undefined)
// 				} else res(rows[0])
// 			})
// 		})
// 	},
// 	updateLogConfig: async (bot, server, channel, data) => {
// 		return new Promise((res)=> {
// 			bot.db.query(`UPDATE logging_configs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id = ? AND channel_id = ?`,[...Object.values(data), server, channel], (err, rows)=> {
// 				if(err) {
// 					console.log(err);
// 					res(false)
// 				} else res(true)
// 			})
// 		})
// 	},
// 	deleteLogConfigs: async (bot, server) => {
// 		return new Promise(res => {
// 			bot.db.query(`DELETE FROM logging_configs WHERE server_id = ?`, [server], (err, rows) => {
// 				if(err) {
// 					console.log(err);
// 					res(false)
// 				} else res(true)
// 			})
// 		})
// 	},
// 	deleteLogConfig: async (bot, server, channel) => {
// 		return new Promise(res => {
// 			bot.db.query(`DELETE FROM logging_configs WHERE server_id = ? AND channel_id = ?`, [server, channel], (err, rows) => {
// 				if(err) {
// 					console.log(err);
// 					res(false)
// 				} else res(true)
// 			})
// 		})
// 	},

// 	getSavedInvites: async (bot, server) => {
// 		return new Promise(res => {
// 			bot.db.query(`SELECT * FROM invites WHERE server_id = ?`, [server], {
// 				id: Number,
// 				server_id: String,
// 				invite_id: String,
// 				name: String
// 			}, (err, rows) => {
// 				if(err) {
// 					console.log(err);
// 					res(undefined)
// 				} else {
// 					if(rows[0]) res(rows);
// 					else res(undefined);
// 				}
// 			})
// 		})
// 	},
// 	getSavedInvite: async (bot, server, name) => {
// 		return new Promise(res => {
// 			bot.db.query(`SELECT * FROM invites WHERE server_id = ? AND LOWER(name) = ?`, [server, name], {
// 				id: Number,
// 				server_id: String,
// 				invite_id: String,
// 				name: String
// 			}, (err, rows) => {
// 				if(err) {
// 					console.log(err);
// 					res(undefined)
// 				} else {
// 					if(rows[0]) res(rows);
// 					else res(undefined);
// 				}
// 			})
// 		})
// 	},
// 	getSavedInviteByID: async (bot, server, id) => {
// 		return new Promise(res => {
// 			bot.db.query(`SELECT * FROM invites WHERE server_id = ? AND invite_id = ?`, [server, id], {
// 				id: Number,
// 				server_id: String,
// 				invite_id: String,
// 				name: String
// 			}, (err, rows) => {
// 				if(err) {
// 					console.log(err);
// 					res(undefined)
// 				} else {
// 					if(rows[0]) res(rows);
// 					else res(undefined);
// 				}
// 			})
// 		})
// 	},
// 	updateInvite: async (bot, server, name, {data}) => {
// 		return new Promise((res)=> {
// 			bot.db.query(`UPDATE invites SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id = ? AND LOWER(name) = ?`,[...Object.values(data), server, name], (err, rows)=> {
// 				if(err) {
// 					console.log(err);
// 					res(false)
// 				} else res(true)
// 			})
// 		})
// 	}),
// 	deleteInvites: async (bot, server) => {
// 		return new Promise(res => {
// 			bot.db.query(`DELETE FROM invites WHERE server_id = ?`, [server], (err, rows) => {
// 				if(err) {
// 					console.log(err);
// 					res(false)
// 				} else res(true)
// 			})
// 		})
// 	},
// 	deleteInvite: async (bot, server, name) => {
// 		return new Promise(res => {
// 			bot.db.query(`DELETE FROM invites WHERE server_id = ? AND LOWER(name) = ?`, [server, name], (err, rows) => {
// 				if(err) {
// 					console.log(err);
// 					res(false)
// 				} else res(true)
// 			})
// 		})
// 	}
	
// }