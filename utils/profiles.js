module.exports = {
	getProfile: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM profiles WHERE user_id=?`, [user], {
				id: Number,
				user_id: String,
				title: String,
				bio: String,
				color: String,
				badges: String,
				lvl: Number,
				exp: Number,
				cash: Number,
				daily: Number,
				disabled: Boolean
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					res(rows[0])
				}
			})
		})
	},
	updateProfile: async (bot, user, key, val) => {
		return new Promise((res)=> {
			bot.db.query(`UPDATE profiles SET ?=? WHERE user_id=?`,[key, val, user], (err, rows)=> {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	createProfile: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO profiles (user_id, title, bio, color, badges, level, exp, cash, daily, disabled) 
						  VALUES (?,?,?,?,?,?,?,?)`,
						 [user,"Title Here","Beep boop!",parseInt("aaaaaa", 16),{},1,5,5,0,0],
			(err,rows)=>{
				if(err){
					console.log("Error creating profile: \n"+err);
					res(false)
				} else {
					console.log("profile created");
					res(true)
				}
			})
		})
	},
	handleBonus: async (bot, msg) => {
		return new Promise(async res => {
			var prof = await bot.utils.getProfile(bot, msg.author.id);
			if(!prof) {
				var scc = await bot.utils.createProfile(bot, msg.author.id);
				return res({success: scc, msg: null});
			}

			var curlvl = prof.lvl;

			if(prof.exp+5 >= (Math.pow(prof.lvl, 2) + 100)){
				prof.lvl = prof.lvl + 1;
				if(prof.exp - (Math.pow(prof.lvl, 2) + 100) >= 0){
					prof.exp = prof.exp - (Math.pow(prof.lvl, 2) + 100);
				} else {
					prof.exp = 0;
				}
			} else prof.exp += 5;

			bot.db.query(`UPDATE profiles SET exp = ?, lvl = ?, cash = cash+5 WHERE user_id = ?`,[prof.exp, prof.lvl, msg.author.id], (err, rows) => {
				if(err) {
					console.log(err);
					res({success: false})
				} else {
					if(!prof.disabled && prof.lvl > curlvl) res({success: true, msg: `Congratulations, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}! You are now level ${prof.lvl}!`});
					else res({success: true})
				}
			});
		})
	},
	checkDaily: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM profiles WHERE user_id=?`, [user], {
				id: Number,
				user_id: String,
				title: String,
				bio: String,
				color: String,
				badges: String,
				lvl: Number,
				exp: Number,
				cash: Number,
				daily: Number,
				disabled: Boolean
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res('err')
				} else if(!rows[0]) {
					res('err')
				} else {
					if(Date.now() - rows[0].daily < (24*60*60*1000)) res(true);
					else res(false);
				}
			})
		})
	},
	setDaily: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM profiles WHERE user_id=?`, [user], {
				id: Number,
				user_id: String,
				title: String,
				bio: String,
				color: String,
				badges: String,
				lvl: Number,
				exp: Number,
				cash: Number,
				daily: Number,
				disabled: Boolean
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res('err')
				} else {
					bot.db.query(`UPDATE profiles SET cash = cash + 150, daily = ? WHERE user_id=?`,[Date.now(), user], (err, rows)=> {
						if(err) {
							console.log(err);
							res(false)
						} else res(true)
					})
				}
			})
		})
	}
}