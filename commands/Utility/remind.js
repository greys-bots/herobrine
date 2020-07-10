module.exports = {
	help: ()=> "Create and manage reminders",
	usage: ()=> [" - Lists your registered reminders and the times left on them",
				 " [id] - Views a specific reminder",
				 " [reminder] in [time] - Reminds you in X amount of time",
				 " [reminder] tomorrow - Reminds you tomorrow",
				 " [reminder] next [time] - Reminds you next [x]. Valid inputs are `week` or a day of the week (eg: Friday)",
				 " [reminder] this [day of week] - Reminds you on X day of this week. Will be invalid if that day has already passed",
				 " [reminder] every [time] - Reminds you every X amount of time",
				 " remove ([id]|*) - Removes a reminder, or all reminders",
				 " edit [id] [new reminder] - Edits the text for a reminder"],
	desc: ()=> "NOTE: Starting a reminder with 'edit' or 'remove' might trigger the subcommands for that. Be careful!",
	execute: async (bot, msg, args) => {
		if(args[0] && !args[1]) {
			var reminder = await bot.stores.reminders.get(msg.author.id, args[0].toLowerCase());
			if(!reminder) return "Reminder not found.";

			var message;
			if(!reminder.recurring) {
				var message = await msg.channel.createMessage({embed: {
					title: "Reminder",
					description: reminder.note,
					fields: [
						{name: "Time left", value: bot.formatDiff(Date.now(), reminder.time)},
						{name: "Recurring?", value: "No"}
					]
				}})
			} else {
				var recur = bot.utils.parseDate(Object.keys(reminder.interval).map(k => reminder.interval[k]+k).join(" "));
				var message = await msg.channel.createMessage({embed: {
					title: "Reminder",
					description: reminder.note,
					fields: [
						{name: "Time left", value: bot.formatDiff(Date.now(), reminder.time)},
						{name: "Recurring?", value: "Yes"},
						{name: "Interval", value: bot.formatDiff(Date.now(), recur.date)}
					]
				}})
			}
			

			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				data: reminder,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					if(message.channel.guild) {
						try {
							message.removeReactions();
						} catch(e) {
							console.log(e);
							message.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
						}
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: async function(bot, m, em) {
					await m.removeReaction(em.name, this.user)
					switch(em.name) {
						case '⏹️':
							await m.delete();
							delete bot.menus[m.id];
							break;
						case "✏":
							var resp;
							await m.channel.createMessage("Enter the new reminder message. Type `cancel` to cancel.");
							resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 30000});
							if(!resp || !resp[0]) return await m.channel.createMessage("ERR: timed out.");
							if(resp[0].content.toLowerCase()=="cancel") return await msg.channel.createMessage("Action cancelled.");
							try {
								await bot.stores.reminders.update(this.user, this.data.hid, {note: resp[0].content});
							} catch(e) {
								return await m.channel.createMessage("ERR: "+e);
							}
							
							await m.channel.createMessage("Reminder edited!");
							await m.edit({embed: {
								title: "Reminder",
								description: resp[0].content,
								fields: m.embeds[0].fields
							}})
							break;
						case "❌":
							await m.channel.createMessage("Are you sure you want to delete this reminder? (y/n)");
							var resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 30000});
							if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out.");
							if(resp[0].content.toLowerCase() != "y") return m.channel.createMessage("Action cancelled.");

							try {
								await bot.stores.reminders.delete(this.user, this.data.hid);
							} catch(e) {
								return await m.channel.createMessage("ERR: "+e);
							}
							await m.channel.createMessage("Reminder deleted!");
							if(m.channel.guild) {
								try {
									await m.removeReactions();
								} catch(e) {
									console.log(e);
									await m.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
								}
							}
							delete bot.menus[m.id];
							break;
					}
				}
			};
			["⏹️","\u270f","❌"].forEach(r => message.addReaction(r));
		} else if(args[1]) {
			var today = new Date();
			// var limit = new Date(Date.now() + 90*24*60*60*1000);
			// var min = new Date(Date.now() + 5*60*1000);
			// var min_recurring = new Date(Date.now() + 24*60*60*1000);
			var limit = new Date(Date.now() + 90*24*60*60*1000);
			var min = new Date(Date.now() + 0);
			var min_recurring = new Date(Date.now() + 0);
			var type;
			var in_ind = args.map(a => a.toLowerCase()).lastIndexOf("in"); //love me some good old fashioned
			var every = args.map(a => a.toLowerCase()).lastIndexOf("every"); //case insensitivity
			var rem;
			var time_input;
			if(in_ind == -1 && every == -1) {
				if(args[args.length-1].toLowerCase() == "tomorrow") {
					type = "single";
					rem = args.slice(0, args.length-1).join(" ");
					time_input = "1d";
				} else if(args[args.length-2].toLowerCase() == "next") {
					console.log("next");
					if(bot.strings.weekdays.includes(args[args.length-1].toLowerCase())) {
						type = "single";
						rem = args.slice(0, args.length-2).join(" ");
						time_input = (6-today.getDay() + bot.strings.weekdays.indexOf(args[args.length-1].toLowerCase())%7+1)+"d";
					} else if(args[args.length-1].toLowerCase() == "week") {
						type = "single";
						rem = args.slice(0, args.length-2).join(" ");
						time_input = "1w";
					}
				} else if(args[args.length-2].toLowerCase() == "this") {
					if(bot.strings.weekdays.includes(args[args.length-1].toLowerCase())) {
						type = "single";
					}
				}
			} else {
				if(in_ind > every) {
					type = "single";
					rem = args.slice(0, in_ind).join(" ");
					time_input = args.slice(in_ind+1, args.length).join(" ");
				} else {
					type = "recurring";
					rem = args.slice(0, every).join(" ");
					if(bot.strings.weekdays.includes(args[args.length-1].toLowerCase())) {
						time_input = [(6-today.getDay() + bot.strings.weekdays.indexOf(args[args.length-1].toLowerCase())%7+1)+"d",
									  (args[args.length-2].toLowerCase() == "other" ? "2w" : "1w")];
					} else if(args[args.length-1].toLowerCase() == "week") {
						time_input = "1w";
					} else if(args.slice(args.length-2).join(" ").toLowerCase() == "other day") {
						time_input = "2d";
					} else {
						time_input = args.slice(every+1, args.length).join(" ");
					}		
				}
			}

			if(!type || !rem || !time_input) return "Please provide a valid reminder and time format. If you need help, use `hh!help remind`";

			if(rem.length == 0) return "Please provide a valid reminder.";
			if(!time_input) return "Please provide a valid time format, eg: `2 hours`.";

			var time;
			time = bot.utils.parseDate(time_input);
			if(!time) return "That time format is invalid, please try another. Example: `hh!remind stuff in 2 hours 10 minutes`";
			if((time.date && time.date > limit) || (time[0] && time[0].date > limit)) return "That time is too far in the future. Reminders must be within 90 days of today, and will only execute after that if they're recurring.";
			if((type!="recurring" && time.date && time.date < min) || (type!="recurring" && time[0] && time[0].date < min) ||
			   (type=="recurring" && time.date && time.date < min_recurring) || (type=="recurring" && time[0] && time[0].date < min_recurring)) return "That time is too close to now. Reminders must be set at least 5 minutes from now, or at least 1 day from now if they're recurring.";

			var code = bot.utils.genCode(4, bot.strings.codestab);

			try {
				await bot.stores.reminders.create(msg.author.id, code, {
					note: rem,
					time: time.date ? time.date.toISOString() : time[0].date.toISOString(),
					recurring: type == "recurring",
					interval: type == "recurring" ? (time.parsed ? time.parsed : time[1].parsed) : null
				});
				bot.reminders[msg.author.id+"-"+code] = bot.scheduler.scheduleJob(time.date ? time.date : time[0].date, ()=> bot.stores.reminders.send(msg.author.id, code));
			} catch(e) {
				if(e.message) await bot.stores.reminders.delete(msg.author.id, code);
				return "ERR: "+(e.message || e);
			}

			return `Reminder set for ${bot.formatDiff(Date.now(), time.date ? time.date : time[0].date)} from now. ID: ${code}`;
		} else {
			var reminders = await bot.stores.reminders.getAll(msg.author.id);
			var embeds = await bot.utils.genEmbeds(bot, reminders, async (r) => {
				if(!r.recurring) {
					return {
						name: `${r.note} (${r.hid})`,
						value: `Occurs in ${bot.formatDiff(Date.now(), new Date(r.time))}`
					}
				} else {
					var recur = bot.utils.parseDate(Object.keys(r.interval).map(k => r.interval[k]+k).join(" "));
					return {
						name: `${r.note} (${r.hid})`,
						value: `Recurs in ${bot.formatDiff(Date.now(), recur.date)} | Next occurance: ${bot.formatDiff(Date.now(), r.time)}`
					}
				}
			}, {
				title: "Reminders",
				color: parseInt("5555aa",16)
			});

			return embeds;
		}
	},
	alias: ["reminder", "remindme", "reminders", "reminds"],
	subcommands: {},
	module: "utility"
}

module.exports.subcommands.remove = {
	help: ()=> "Remove a reminder you have set",
	usage: ()=> [" [id] - Removes a reminder",
				 " *|all - Removes all reminders"],
	execute: async (bot, msg, args) => {
		if(["*","all"].includes(args[0].toLowerCase())) {
			var reminders = await bot.stores.reminders.getAll(msg.author.id);
			if(!reminders || !reminders[0]) return "You don't have any reminders to delete.";

			var message = await msg.channel.createMessage("Are you sure you want to delete **all** your reminders?");
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				data: reminders,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					if(message.channel.guild) {
						try {
							message.removeReactions();
						} catch(e) {
							console.log(e);
							message.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
						}
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: async function(bot, m, e){
					switch(e.name) {
						case "✅":
							this.data.forEach(r => {
								if(bot.reminders[r.user_id+"-"+r.hid]) {
									bot.reminders[r.user_id+"-"+r.hid].cancel();
									delete bot.reminders[r.user_id+"-"+r.hid];
								}
							})
							try {
								await bot.stores.reminders.deleteAll(msg.author.id);
							} catch(e) {
								return await m.channel.createMessage("ERR: "+e);
							}

							await m.channel.createMessage("Reminders deleted!");
							break;
						case "❌":
							await m.channel.createMessage("Action cancelled");
							break;
					}
				}
			};
			["✅","❌"].forEach(r => message.addReaction(r))
		} else {
			var reminder = await bot.stores.reminders.get(msg.author.id, args[0].toLowerCase());
			if(!reminder) return "Couldn't find that reminder.";

			var message = await msg.channel.createMessage("Are you sure you want to delete this reminder?");
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				data: reminder.hid,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					if(message.channel.guild) {
						try {
							message.removeReactions();
						} catch(e) {
							console.log(e);
							message.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
						}
					}
					delete bot.menus[message.id];
				}, 900000),
				execute: async function(bot, m, e){
					switch(e.name) {
						case "✅":
							if(bot.reminders[this.user+"-"+this.data]) {
								bot.reminders[this.user+"-"+this.data].cancel();
								delete bot.reminders[this.user+"-"+this.data];
							}
							try {
								await bot.stores.reminders.delete(this.user, this.data);
							} catch(e) {
								return await m.channel.createMessage("ERR: "+e);
							}
							
							await m.channel.createMessage("Reminder deleted!");
							break;
						case "❌":
							await m.channel.createMessage("Action cancelled");
							break;
					}
				}
			};
			["✅","❌"].forEach(r => message.addReaction(r))
		}
	},
	alias: ["delete", "-"]
}

module.exports.subcommands.edit = {
	help: ()=> "Edits a reminder you have set",
	usage: ()=> [" [id] [new reminder] - Edits the text for a reminder"],
	desc: ()=> "NOTE: This can't be used to reschedule reminders. Please remove the reminder first if you want to do that",
	execute: async (bot, msg, args) => {
		var reminder = await bot.stores.reminders.get(msg.author.id, args[0].toLowerCase());
		if(!reminder) return "Couldn't find that reminder.";

		try {
			await bot.stores.reminders.update(msg.author.id, reminder.hid, {note: args.slice(1).join(" ")});
		} catch(e) {
			return "ERR: "+e;
		}
		
		return "Reminder edited!";
	}
}
