module.exports = {
	addPoll: async (bot, hid, server, channel, message, user, title, description, choices, time) => {
		return new Promise(res => {
			bot.db.query(`INSERT INTO polls (hid, server_id, channel_id, message_id, user_id, title, 
						  description, choices, active, start) VALUES (?,?,?,?,?,?,?,?,?,?)`,
				[hid, server, channel, message, user, title, description, choices, 1, time], (err, rows) => {
				if(err) {
					console.log(err);
					res(false);
				} else {
					res(true)
				}
			})
		})
	},
	getPoll: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM polls WHERE server_id = ? AND channel_id = ? AND message_id = ?`,[server, channel, message], {
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
				start: String,
				end: String
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
	getPollByHid: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM polls WHERE server_id = ? AND hid = ?`,[server, hid], {
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
				start: String,
				end: String
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
	getPolls: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM polls WHERE server_id = ?`,[server], {
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
				start: String,
				end: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res(rows);
					else res(undefined)
				}
			})
		})
	},
	getPollsFromUser: async (bot, server, user) => {
		return new Promise(res => {
			bot.db.query(`SELECT * FROM polls WHERE server_id = ?`,[server, user], {
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
				start: String,
				end: String
			}, (err, rows) => {
				if(err) {
					console.log(err);
					res(undefined);
				} else {
					if(rows[0]) res(rows);
					else res(undefined)
				}
			})
		})
	},
	searchPolls: async (bot, server, user, query) => {
		return new Promise(async res => {
			var polls = await bot.utils.getPolls(bot, server);
			if(!polls) res(undefined);
			if(user) polls = polls.filter(p => p.user_id == user);
			if(query) {
				query = query.toLowerCase()
				polls = polls.filter(p => p.title.toLowerCase().includes(query) || 
										  p.description.toLowerCase().includes(query) || 
										  p.choices.find(c => c.option.toLowerCase().includes(query)));
			}
			if(polls[0]) res(polls);
			else res(undefined);
		})	
	},
	editPoll: async (bot, server, channel, message, key, val) => {
		return new Promise(res => {
			bot.db.query(`UPDATE polls SET ?=? WHERE server_id = ? AND channel_id = ? AND message_id = ?`,
				[key, val, server, channel, message], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deletePoll: async (bot, server, channel, message) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM polls WHERE server_id = ? AND channel_id = ? AND message_id = ?`, [server, channel, message],
				(err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deletePollsByID: async (bot, server, ids) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM polls WHERE server_id = ? AND message_id IN (${ids.join(",")})`, [server],
				(err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deletePollsByChannel: async (bot, server, channel) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM polls WHERE server_id = ? AND channel_id = ?`, [server, channel],
				(err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deletePollsByServer: async (bot, server) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM polls WHERE server_id = ?`, [server],
				(err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	deletePollByHID: async (bot, server, hid) => {
		return new Promise(res => {
			bot.db.query(`DELETE FROM polls WHERE server_id = ? AND hid = ?`, [server, hid],
				(err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	endPoll: async (bot, server, hid, time) => {
		return new Promise(res => {
			bot.db.query(`UPDATE polls SET active=?,end=? WHERE server_id = ? AND hid = ?`,
				[0, time, server, hid], (err, rows) => {
				if(err) {
					console.log(err);
					res(false)
				} else {
					res(true)
				}
			})
		})
	},
	handlePollReactions: async (bot, msg, emoji, user) => {
		var poll = await bot.utils.getPoll(bot, msg.guild.id, msg.channel.id, msg.id);
		if(!poll) return;
		var owner = bot.users.find(u => u.id == poll.user_id);
		if(!owner) owner = {username: "(user not cached)", discriminator: "0000", avatarURL: "https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png"};
		var embed = msg.embeds[0];
		if(!embed) embed = {
			title: poll.title,
			description: poll.desc,
			color: parseInt("55aa55", 16),
			fields: poll.choices.map((c, i) => {
				return {name: `:${i+1 == 10 ? "keycap_10" : bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} votes`}
			}),
			footer: {
				text: `ID: ${poll.hid} | Started: ${bot.formatTime(poll.timestamp)}`
			},
			author: {
				name: `${owner.username}#${owner.discriminator}`,
				icon_url: `${owner.avatarURL}`
			},
			timestamp: poll.timestamp
		}

		if(!poll.active) return;
		if(bot.strings.pollnumbers.includes(emoji.name)) {
			var ind = bot.strings.pollnumbers.indexOf(emoji.name)-1;
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
				await bot.utils.editPoll(bot, poll.server_id, poll.channel_id, poll.message_id, "choices", poll.choices);
				
				try {
					await bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
					await bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
				} catch(e) {
					console.log(e);
					return false;
				}
			}
		} else {
			switch(emoji.name) {
				case "✅":
					await bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
					if(poll.user_id == user) {
						var date = new Date();
						await bot.utils.endPoll(bot, poll.server_id, poll.hid, date.toISOString());
					
						embed.title += " (ENDED)";
						embed.color = parseInt("aa5555", 16);
						embed.footer.text += " | Ended: "+bot.formatTime(date);
						embed.timestamp = date.toISOString();
						await bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
						await msg.removeReactions();
					}
					break;
				case "\u270f":
					await bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
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
								await bot.utils.editPoll(bot, poll.server_id, poll.channel_id, poll.message_id, "title", resp[0].content);
								await bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
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
								await bot.utils.editPoll(bot, poll.server_id, poll.channel_id, poll.message_id, "description", resp[0].content);
								await bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
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
									return {name: `:${bot.strings.numbers[i+1]}: ${c.option}`, value: `${c.count} ${c.count != 1 ? "votes" : "vote"}`}
								})
								try {
									await bot.removeMessageReactions(poll.channel_id, poll.message_id);
								} catch(e) {
									msg.channel.createMessage("The poll has been edited internally, but I can't remove extra reactions. Make sure I have the permission to `manageMessages`");
								}
								choices.forEach((c,i) =>  bot.addMessageReaction(poll.channel_id, poll.message_id,`${bot.strings.pollnumbers[i+1]}`));
								["✅","✏","❓"].forEach(r => bot.addMessageReaction(poll.channel_id, poll.message_id, r));
								await bot.utils.editPoll(bot, poll.server_id, poll.channel_id, poll.message_id, "choices", choices);
								await bot.editMessage(poll.channel_id, poll.message_id, {embed: embed});
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
					var ch = await bot.getDMChannel(user);
					if(ch) {
						if(!poll.choices.find(c => c.voters && c.voters.includes(user))) ch.createMessage("You haven't voted for that poll yet");
						else ch.createMessage(`Your vote: **${poll.choices.find(c => c.voters && c.voters.includes(user)).option}**`);
					}
					await bot.removeMessageReaction(poll.channel_id, poll.message_id, emoji.name, user);
					break;
			}
		}
		return true;
	}
}