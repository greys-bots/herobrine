const {Collection} = require("discord.js");

class PollStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	}

	async init() {
		this.bot.on("messageReactionAdd", (...args) => {
			try {
				this.handleReactions(...args)
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageDelete", async (msg) => {
			try {
				this.deleteByMessage(msg.channel.guild.id, msg.channel.id, msg.id);
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageDeleteBulk", async (msgs) => {
			try {
				this.deleteByMessages(msgs[0].channel.guild.id, msgs.map(msg => msg.id));
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("channelDelete", async (channel) => {
			await this.deleteByChannel(channel.guild.id, channel.id);
		})
	}

	async create(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO polls (
					hid,
					server_id,
					channel_id,
					message_id,
					user_id,
					title,
					description,
					choices,
					active,
					start_time,
					end_time
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
				[hid, server, data.channel_id, data.message_id, data.user_id, data.title,
				 data.description, data.choices || [], data.active || 1, data.start_time || new Date(), data.end_time])
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
				await this.db.query(`INSERT INTO polls (
					hid,
					server_id,
					channel_id,
					message_id,
					user_id,
					title,
					description,
					choices,
					active,
					start_time,
					end_time
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
				[hid, server, data.channel_id, data.message_id, data.user_id, data.title,
				 data.description, data.choices || [], data.active || 1, data.start_time || new Date(), data.end_time])
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
				var poll = super.get(`${server}-${hid}`);
				if(poll) return res(poll);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM polls WHERE server_id = $1 AND hid = $2`,[server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				try {
					var message = await this.bot.getMessage(data.rows[0].channel_id, data.rows[0].message_id);
				} catch(e) {
					console.log(e);
				}
				if(message) data.rows[0].message = message;

				this.set(`${server}-${hid}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByMessage(server, channel, message) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM polls WHERE server_id = $1 AND channel_id = $2 AND message_id = $3`,[server, channel, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				try {
					var msg = await this.bot.getMessage(data.rows[0].channel_id, data.rows[0].message_id);
				} catch(e) {
					console.log(e);
				}
				if(msg) data.rows[0].message = msg;

				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM polls WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					try {
						var message = await this.bot.getMessage(data.rows[i].channel_id, data.rows[i].message_id);
					} catch(e) {
						console.log(e);
					}
					if(message) data.rows[i].message = message;
				}

				res(data.rows)
			} else res(undefined);
		})
	}

	async getByChannel(server, channel) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM polls WHERE server_id = $1 AND channel_id = $2`,[server, channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					try {
						var message = await this.bot.getMessage(data.rows[i].channel_id, data.rows[i].message_id);
					} catch(e) {
						console.log(e);
					}
					if(message) data.rows[i].message = message;
				}

				res(data.rows)
			} else res(undefined);
		})
	}

	async getByUser(server, user) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM polls WHERE server_id = $1 AND user_id = $2`,[server, user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				for(var i = 0; i < data.rows.length; i++) {
					try {
						var message = await this.bot.getMessage(data.rows[i].channel_id, data.rows[i].message_id);
					} catch(e) {
						console.log(e);
					}
					if(message) data.rows[i].message = message;
				}

				res(data.rows)
			} else res(undefined);
		})
	}

	async search(server, query = {}) {
		return new Promise(async (res, rej) => {
			var polls;
			try {
				if(query.user_id) polls = await this.getByUser(server, query.user_id);
				else polls = await this.getAll(server);
			} catch(e) {
				return rej(e)
			}

			if(query.message)
				polls = polls.filter(p => {
					return p.description.toLowerCase().includes(query.message) ||
						   p.title.toLowerCase().includes(query.message);
				});

			if(polls[0]) res(polls);
			else res(undefined);
		})
	}

	async update(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE polls SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND hid = $2`,[server, hid, ...Object.values(data)]);
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
				await this.db.query(`DELETE FROM polls WHERE server_id = $1 AND hid = $2`, [server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${hid}`);
			res();
		})
	}

	async deleteByMessage(server, channel, message) {
		return new Promise(async (res, rej) => {
			var poll = await this.getByMessage(server, channel, message);
			if(!poll) return;
			try {
				await this.db.query(`DELETE FROM polls WHERE server_id = $1 AND hid = $2`, [server, poll.hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${poll.hid}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var polls = await this.getAll(server);
				await this.db.query(`DELETE FROM polls WHERE server_id = $1`, [server]);
				for(var poll of polls) super.delete(`${server}-${poll.hid}`)
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async deleteByChannel(server, channel) {
		return new Promise(async (res, rej) => {
			try {
				var polls = await this.getByChannel(server, channel);
				await this.db.query(`DELETE FROM polls WHERE server_id = $1 AND channel_id = $2`, [server, channel]);
				for(var poll of polls) super.delete(`${server}-${poll.hid}`)
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async deleteByMessages(server, channel, ids) {
		return new Promise(async (res, rej) => {
			try {
				var polls = [];
				for(var id of ids) {
					var poll = await this.getByMessage(server, channel, id);
					if(poll) polls.push(poll);
				}

				await this.db.query(`DELETE FROM polls WHERE server_id = $1 AND channel_id = $2 AND message_id = ANY($2)`, [server, channel, ids]);
				for(var poll of polls) super.delete(`${server}-${poll.hid}`)
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}

	async handleReactions(msg, emoji, user) {
		user = user.id;
		if(user == this.bot.user.id) return;
		if(!msg.channel.guild) return;
		var poll = await this.getByMessage(msg.channel.guild.id, msg.channel.id, msg.id);
		if(!poll) return;
		var owner = this.bot.users.find(u => u.id == poll.user_id);
		if(!owner) owner = {username: "(user not cached)", discriminator: "0000", avatarURL: "https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png"};
		var embed = poll.message.embeds[0];
		if(!embed) embed = {
			title: poll.title,
			description: poll.desc,
			color: parseInt("55aa55", 16),
			fields: poll.choices.map((c, i) => {
				return {name: `:${i+1 == 10 ? "keycap_10" : this.bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} votes`}
			}),
			footer: {
				text: `ID: ${poll.hid} | Started: ${this.bot.formatTime(poll.timestamp)}`
			},
			author: {
				name: `${owner.username}#${owner.discriminator}`,
				icon_url: `${owner.avatarURL}`
			},
			timestamp: poll.timestamp
		}

		if(!poll.active) return;
		if(this.bot.strings.pollnumbers.includes(emoji.name)) {
			var ind = this.bot.strings.pollnumbers.indexOf(emoji.name)-1;
			if(poll.choices[ind]) {
				var choice = poll.choices[ind];
				if(!choice.voters) choice.voters = [];
				if(choice.voters.includes(user)) {
					choice.count -= 1;
					choice.voters = choice.voters.filter(v => v != user);
					embed.fields[ind].value = choice.count + " votes";
				} else if(poll.choices.find(c => c.voters && c.voters.includes(user))) {
					var ind2 = poll.choices.indexOf(poll.choices.find(c => c.voters && c.voters.includes(user)));
					poll.choices[ind2].voters = poll.choices[ind2].voters.filter(v => v != user);
					poll.choices[ind2].count -= 1;
					choice.count += 1;
					choice.voters.push(user);
					embed.fields[ind].value = choice.count + " votes";
					embed.fields[ind2].value = poll.choices[ind2].count + " votes";
				} else {
					choice.count += 1;
					choice.voters.push(user);
					embed.fields[ind].value = choice.count + " votes";
				}
				poll.choices[ind] = choice;
				await this.update(poll.server_id, poll.hid, {choices: JSON.stringify(poll.choices)});
				
				try {
					await this.bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
					await this.bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
				} catch(e) {
					console.log(e);
					return false;
				}
			}
		} else {
			switch(emoji.name) {
				case "✅":
					await this.bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
					if(poll.user_id == user) {
						var date = new Date();
						await this.update(poll.server_id, poll.hid, {active: false, end_time: date.toISOString()});
					
						embed.title += " (ENDED)";
						embed.color = parseInt("aa5555", 16);
						embed.footer.text += " | Ended: "+this.bot.formatTime(date);
						embed.timestamp = date.toISOString();
						await this.bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
						await this.bot.removeMessageReactions(poll.channel_id, poll.message_id);
					}
					break;
				case "✏":
					await this.bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
					if(poll.user_id == user) {
						var resp;
						var m2;
						m2 = await msg.channel.createMessage([
							"What would you like to edit?",
							"```",
							"1 - title",
							"2 - description",
							"3 - choices",
							"```"
						].join("\n"));
						resp = await msg.channel.awaitMessages(m => m.author.id == user, {time: 30000, maxMatches: 1});
						if(!resp || !resp[0]) {
							var errmsg = msg.channel.createMessage("ERR: timed out. Aborting");
							setTimeout(()=> errmsg.delete(), 15000);
							return;
						}

						await resp[0].delete();
						switch(resp[0].content.toLowerCase()) {
							case "1":
								await m2.edit("Enter the new title. You have a minute to do this, or you can type `cancel` to cancel");
								resp = await msg.channel.awaitMessages(m => m.author.id == user, {time: 60000, maxMatches: 1});
								if(!resp || !resp[0]) { 
									var errmsg = msg.channel.createMessage("ERR: timed out. Aborting");
									setTimeout(()=> errmsg.delete(), 15000);
									return;
								}
								if(resp[0].content.toLowerCase() == "cancel") {
									await m2.delete();
									await resp[0].delete();
									return
								}
								embed.title = resp[0].content;
								await this.update(poll.server_id, poll.hid, {title: resp[0].content});
								await this.bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
								await m2.delete();
								await resp[0].delete();
								break;
							case "2":
								await m2.edit("Enter the new description. You have two minutes to do this, or you can type `cancel` to cancel");
								resp = await msg.channel.awaitMessages(m => m.author.id == user, {time: 120000, maxMatches: 1});
								if(!resp || !resp[0]) { 
									var errmsg = msg.channel.createMessage("ERR: timed out. Aborting");
									setTimeout(()=> errmsg.delete(), 15000);
									return;
								}
								if(resp[0].content.toLowerCase() == "cancel") {
									await m2.delete();
									await resp[0].delete();
									return
								}
								embed.description = resp[0].content;
								await this.update(poll.server_id, poll.hid, {description: resp[0].content});
								await this.bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
								await m2.delete();
								await resp[0].delete();
								break;
							case "3":
								await m2.edit("Enter the new choices. These should be separated by new lines. You have five minutes to do this, or you can type `cancel` to cancel\nNOTE: This will clear current votes");
								resp = await msg.channel.awaitMessages(m => m.author.id == user, {time: 300000, maxMatches: 1});
								if(!resp || !resp[0]) { 
									var errmsg = msg.channel.createMessage("ERR: timed out. Aborting");
									setTimeout(()=> errmsg.delete(), 15000);
									return;
								}
								if(resp[0].content.toLowerCase() == "cancel") {
									await m2.delete();
									await resp[0].delete();
									return
								}

								var choices = resp[0].content.split("\n").map(c => {
									return {option: c, count: 0}
								});

								embed.fields = choices.map((c, i) => {
									return {name: `:${this.bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} ${c.count != 1 ? "votes" : "vote"}`}
								})
								try {
									await this.bot.removeMessageReactions(poll.channel_id, poll.message_id);
								} catch(e) {
									msg.channel.createMessage("The poll has been edited internally, but I can't remove extra reactions. Make sure I have the permission to `manageMessages`");
								}
								choices.forEach((c,i) =>  this.bot.addMessageReaction(poll.channel_id, poll.message_id,`${this.bot.strings.pollnumbers[i+1]}`));
								["✅","✏","❓"].forEach(r => this.bot.addMessageReaction(poll.channel_id, poll.message_id, r));
								await this.update(poll.server_id, poll.hid, {choices: JSON.stringify(choices)});
								await this.bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
								await m2.delete();
								await resp[0].delete();
								break;
							default:
								var errmsg = msg.channel.createMessage("ERR: timed out. Aborting")
								break;
						}
					}
					break;
				case "❓":
				case "❔":
					var ch = await this.bot.getDMChannel(user);
					if(ch) {
						if(!poll.choices.find(c => c.voters && c.voters.includes(user))) ch.createMessage("You haven't voted for that poll yet");
						else ch.createMessage(`Your vote: **${poll.choices.find(c => c.voters && c.voters.includes(user)).option}**`);
					}
					await this.bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
					break;
			}
		}
		return true;
	}
}

module.exports = (bot, db) => new PollStore(bot, db);