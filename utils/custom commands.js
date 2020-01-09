module.exports = {
	getCustomCommands: async (bot, id) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM commands WHERE server_id=?`,[id],
				{
					id: Number,
					server_id: String,
					name: String,
					actions: JSON.parse,
					target: String,
					del: Number
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
	getCustomCommand: async (bot, id, name) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM commands WHERE server_id=? AND name=?`,[id, name],
				{
					id: Number,
					server_id: String,
					name: String,
					actions: JSON.parse,
					target: String,
					del: Number
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
	addCustomCommand: async (bot, server, name, actions, target, del) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO commands (server_id, name, actions, target, del) VALUES (?,?,?,?,?)`,[server, name, actions, target, del], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	updateCustomCommand: async (bot, server, name, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE commands SET ?=? WHERE server_id = ? AND name = ?`,[key, val, server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteCustomCommand: async (bot, server, name) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM commands WHERE server_id=? AND name=?`,[server, name], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	deleteCustomCommands: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM commands WHERE server_id=?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else res(true);
			})
		})
	},
	parseCommandActions: async (bot, cmd) => {
		return new Promise(res => {
			var actions = [];
			cmd.actions.forEach(a => {
				var text = "";
				switch(a.type) {
					// case "if":
					// 	var condition = action.condition;
					// 	var ac = action.action;
					// 	bot.customActions.forEach(ca => {
					// 		var n = ca.regex ? new RegExp(ca.name) : ca.name;
					// 		condition = condition.replace(n, ca.replace)
					// 		ac = ac.replace(n, ca.replace);
					// 	})
					// 	cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
					// 		`if(${condition}) ${ac};`
					// 	), action.success, action.fail]);
					// 	break;
					// case "if:else":
					// 	var condition = action.condition;
					// 	var tr = action.action[0];
					// 	var fls = action.action[1];
					// 	bot.customActions.forEach(ca => {
					// 		var n = ca.regex ? new RegExp(ca.name) : ca.name;
					// 		condition = condition.replace(n, ca.replace)
					// 		tr = tr.replace(n, ca.replace);
					// 		fls = fls.replace(n, ca.replace);
					// 	})

					// 	cmd.newActions.push([new AsyncFunction("bot", "msg", "args",
					// 		`if(${condition}) ${tr};
					// 		 else ${fls}`
					// 	), action.success, action.fail]);
					// 	break;
					case "rr":
						var rl = a.action.match(/rf\('(.*)'\)/);
						text = `Removes role "${rl[1]}"`;
						break;
					case "ar":
						var rl = a.action.match(/rf\('(.*)'\)/);
						text = `Adds role "${rl[1]}"`;
						break;
					case "bl":
						text = "Blacklists target from using the bot";
						break;
				}
				actions.push(text);
			})
			res(actions);
		})
	}
}