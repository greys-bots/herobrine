module.exports = {
	getProfile: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM profiles WHERE user_id=?`, [user], {
				user_id: String,
				info: JSON.parse,
				badges: String,
				lvl: String,
				exp: String,
				cash: String,
				daily: String,
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
			bot.db.query(`INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?)`,[user,{title:"Title Here",bio:"Beep boop!"},{},"1","5","5","0",0],(err,rows)=>{
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
			var exp = parseInt(prof.exp);
			var lve = parseInt(prof.lvl);

			if(exp+5>=(Math.pow(lve,2)+100)){

				lve=lve+1;
				if(exp-(Math.pow(lve,2)+100)>=0){
					exp=exp-(Math.pow(lve,2)+100);
				} else {
					exp=0;
				}

			} else exp=exp+5;

			bot.db.query(`UPDATE profiles SET exp=?, lvl=?, cash = cash+5 WHERE user_id=?`,[exp, lve, msg.author.id], (err, rows) => {
				if(err) {
					console.log(err);
					res({success: false})
				} else {
					if(!prof.disabled && lve > prof.lvl) res({success: true, msg: `Congratulations, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}! You are now level ${lve}!`});
					else res({success: true})
				}
			});
		})
	},
	checkDaily: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM profiles WHERE user_id=?`, [user], {
				user_id: String,
				info: String,
				badges: String,
				lvl: String,
				exp: String,
				cash: String,
				daily: String,
				disabled: Boolean
			}, (err, rows)=> {
				if(err) {
					console.log(err);
					res('err')
				} else if(!rows[0]) {
					res('err')
				} else {
					if(Date.now() - parseInt(rows[0].daily) < (24*60*60*1000)) res(true);
					else res(false);
				}
			})
		})
	},
	setDaily: async (bot, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM profiles WHERE user_id=?`, [user], {
				user_id: String,
				info: String,
				badges: String,
				lvl: String,
				exp: String,
				cash: String,
				daily: String,
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