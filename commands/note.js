module.exports = {
	help: ()=> "View and manage notes",
	usage: ()=> [" - Lists your current notes",
				 " [hid] - Views a specific note",
				 " add - Opens a menu to add a new note",
				 " delete [hid | *] - Removes the given note, or all notes",
				 " edit [hid] - Opens a menu to edit a note"
				 ],
	execute: async (bot, msg, args) => {
		if(args[0]) {
			var note = await bot.utils.getNote(bot, msg.author.id, args[0].toLowerCase());
			if(!note) return msg.channel.createMessage("Couldn't find a note with that id");

			var fields = note.body.match(/.{1,1024}/gs).map((s,i)=> {
				return {
					name: `Body${i>0 ? " (cont)" : ""}`,
					value: s
				}
			})

			var message = await msg.channel.createMessage({embed: {
				title: note.title,
				fields: fields,
				footer: {
					text: `ID: ${note.hid}`
				}
			}})
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				data: note,
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
				execute: async function(bot, m, e) {
					switch(e.name) {
						case '⏹️':
							await m.delete();
							delete bot.menus[m.id];
							break;
						case "\u270f":
							var resp;
							await m.channel.createMessage([
								"What would you like to edit?",
								"```",
								"1 - Title",
								"2 - Body",
								"```"
							].join("\n"));
							resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 30000});
							if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
							switch(resp[0].content) {
								case "1":
									await m.channel.createMessage("Enter the new title. You have 1 minute to do this");
									resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 60000});
									if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
									if(resp[0].content.length > 100) return m.channel.createMessage("ERR: title must be 100 characters or less");
									var scc = await bot.utils.editNote(bot, this.user, this.data.hid, "title", resp[0].content);
									if(scc) m.channel.createMessage("Note edited!");
									else m.channel.createMessage("Something went wrong");
									m.edit({embed: {
										title: resp[0].content,
										fields: m.embeds[0].fields
									}})
									if(m.channel.guild) {
										try {
											await m.removeReactions();
										} catch(e) {
											console.log(e);
											m.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
										}
									}
									delete bot.menus[m.id];
									break;
								case "2":
									await m.channel.createMessage("Enter the new body. You have 5 minutes to do this");
									resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 5*60000});
									if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
									var scc = await bot.utils.editNote(bot, this.user, this.data.hid, "body", resp[0].content);
									if(scc) m.channel.createMessage("Note edited!");
									else m.channel.createMessage("Something went wrong");
									m.edit({embed: {
										title: m.embeds[0].title,
										fields: resp[0].content.match(/.{1,1024}/gs).map((s,i)=> {
											return {
												name: `Body${i>0 ? " (cont)" : ""}`,
												value: s
											}
										})
									}})
									if(m.channel.guild) {
										try {
											await m.removeReactions();
										} catch(e) {
											console.log(e);
											m.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
										}
									}
									delete bot.menus[m.id];
									break;
								default:
									return m.channel.createMessage("ERR: invalid input. Aborting...")
									break;
							}
							break;
						case "❌":
							await m.channel.createMessage("Are you sure you want to delete this note? (y/n)");
							var resp = await m.channel.awaitMessages(ms => ms.author.id == this.user, {maxMatches: 1, time: 30000});
							if(!resp || !resp[0]) return m.channel.createMessage("ERR: timed out");
							if(resp[0].content.toLowerCase() != "y") return m.channel.createMessage("Action cancelled");
							var scc = await bot.utils.deleteNote(bot, msg.author.id, this.data.hid);
							if(scc) {
								m.channel.createMessage("Note deleted!");
								if(m.channel.guild) {
									try {
										await m.removeReactions();
									} catch(e) {
										console.log(e);
										m.channel.createMesage("ERR: Couldn't remove reactions. Make sure I have the `mangeMessages` permission")
									}
								}
								delete bot.menus[m.id];
							}
							else m.channel.createMessage("Something went wrong")
							break;
					}
				}
			};
			["⏹️","\u270f","❌"].forEach(r => message.addReaction(r));
		} else {
			var notes = await bot.utils.getNotes(bot, msg.author.id);
			if(!notes || !notes[0]) return msg.channel.createMessage("You don't have any notes");

			if(notes.length > 10) {
				var embeds = await bot.utils.genEmbeds(bot, notes, async (n) => {
					return {
						name: `${n.title} (${n.hid})`,
						value: n.body.length > 30 ? n.body.slice(0, 30) + "..." : n.body
					}
				}, {
					title: "Notes",
					color: parseInt("5555aa",16)
				});

				var message = await msg.channel.createMessage(embeds[0]);
				if(!bot.menus) bot.menus = {};
				bot.menus[message.id] = {
					user: msg.author.id,
					index: 0,
					data: embeds,
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
					execute: bot.utils.paginateEmbeds
				};
				message.addReaction("\u2b05");
				message.addReaction("\u27a1");
				message.addReaction("\u23f9");
			} else {
				msg.channel.createMessage({embed: {
					title: "Notes",
					fields: notes.map(n => {
						return {
							name: `${n.title} (${n.hid})`,
							value: n.body.length > 30 ? n.body.slice(0, 30) + "..." : n.body
						}
					}),
					color: parseInt("5555aa",16)
				}})
			}
		}
	},
	alias: ["notes"],
	subcommands: {}
}

module.exports.subcommands.add = {
	help: ()=> "Runs a menu to add a new note",
	usage: ()=> [" - Opens the note add menu"],
	execute: async (bot, msg, args) => {
		var count = await bot.utils.getNoteCount(bot, msg.author.id);
		if(count >= 100) return msg.channel.createMessage("You already have 100 or more notes!")
		var resp;
		var title;
		var body;
		await msg.channel.createMessage("Please enter a title for the note. You have 1 minute to do this");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 60000});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out");
		if(resp[0].content.length > 100) return m.channel.createMessage("ERR: title must be 100 characters or less");
		else title = resp[0].content;

		await msg.channel.createMessage("Please enter a body for the note. You have 5 minutes to do this");
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 5*60000});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out");
		else body = resp[0].content;

		var code = bot.utils.genCode(4, bot.strings.codestab);

		var scc = await bot.utils.createNote(bot, msg.author.id, code, title, body);
		if(scc) msg.channel.createMessage(`Note created! ID: ${code}`);
		else msg.channel.createMessage("Something went wrong");

	},
	alias: ["+","new","create"]
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes a note",
	usage: ()=> [" [id] - Deletes the given note",
				 " * - Deletes all notes"],
	execute: async (bot, msg, args) => {
		if(!args) return msg.channel.createMessage("Please provide a note to delete");

		if(['all','*'].includes(args[0].toLowerCase())) {
			var message = await msg.channel.createMessage("Are you sure you want to delete **all** your notes?");
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
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
							var scc = await bot.utils.deleteNotes(bot, this.user);
							if(scc) m.channel.createMessage("Notes deleted!");
							else m.channel.createMessage("Something went wrong")
							break;
						case "❌":
							m.channel.createMessage("Action cancelled");
							break;
					}
				}
			};
			["✅","❌"].forEach(r => message.addReaction(r))
		} else {
			var note = await bot.utils.getNote(bot, msg.author.id, args[0].toLowerCase());
			if(!note) return msg.channel.createMessage("Note not found");

			var message = await msg.channel.createMessage("Are you sure you want to delete this note?");
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				index: 0,
				data: note.hid,
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
							var scc = await bot.utils.deleteNote(bot, this.user, this.data);
							if(scc) m.channel.createMessage("Note deleted!");
							else m.channel.createMessage("Something went wrong")
							break;
						case "❌":
							m.channel.createMessage("Action cancelled");
							break;
					}
				}
			};
			["✅","❌"].forEach(r => message.addReaction(r))
		}
	},
	alias: ["-","remove","clear"]
}

module.exports.subcommands.edit = {
	help: ()=> "Runs a menu to edit a note",
	usage: ()=> [" [id] - Opens the note edit menu"],
	execute: async (bot, msg, args) => {
		if(!args[0]) return msg.channel.createMessage("Please provide a note to edit");

		var note = await bot.utils.getNote(bot, msg.author.id, args[0].toLowerCase());
		if(!note) return msg.channel.createMessage("Couldn't find that note");

		var resp;

		await msg.channel.createMessage([
			"What would you like to edit?",
			"```",
			"1 - Title",
			"2 - Body",
			"```"
		].join("\n"));
		resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 30000});
		if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out");
		switch(resp[0].content) {
			case "1":
				await msg.channel.createMessage("Enter the new title. You have 1 minute to do this");
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 60000});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out");
				if(resp[0].content.length > 100) return m.channel.createMessage("ERR: title must be 100 characters or less");
				var scc = await bot.utils.editNote(bot, msg.author.id, note.hid, "title", resp[0].content);
				if(scc) msg.channel.createMessage("Note edited!");
				else msg.channel.createMessage("Something went wrong");
				break;
			case "2":
				await msg.channel.createMessage("Enter the new body. You have 5 minutes to do this");
				resp = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 5*60000});
				if(!resp || !resp[0]) return msg.channel.createMessage("ERR: timed out");
				var scc = await bot.utils.editNote(bot, msg.author.id, note.hid, "body", resp[0].content);
				if(scc) msg.channel.createMessage("Note edited!");
				else msg.channel.createMessage("Something went wrong");
				break;
			default:
				return msg.channel.createMessage("ERR: invalid input. Aborting...")
				break;
		}
	}
}