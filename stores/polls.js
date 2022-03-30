const strings = require('../strings');
const { confBtns: BUTTONS } = require('../extras');

const KEYS = {
	'id': { },
	'hid': { },
	'server_id': { },
	'channel_id': { },
	'message_id': {
		patch: true
	},
	'user_id': { },
	'title': {
		patch: true,
		test: (v) => v.length <= 100,
		err: "Title must be at most 100 characters"
	},
	'description': {
		patch: true,
		test: (v) => v.length <= 2000,
		err: "Description must be at most 2000 characters"
	},
	'choices': {
		patch: true,
		test: (v) => (
			v.length > 2 && v.length <= 10 &&
			!v.find(x => x.option.length > 100)
		),
		err: "Polls need between 2 and 10 choices, each at most 100 characters long",
		transform: (v) => JSON.stringify(v)
	},
	'active': {
		patch: true
	},
	'start_time': { },
	'end_time': {
		patch: true
	},
	'multi': { }
};

const EDIT = [
	{
		label: 'title',
		value: 'title',
	},
	{
		label: 'description',
		value: 'description'
	}
]

class Poll {
	#store;
	
	constructor(store, data) {
		this.#store = store;
		for(var k in KEYS) this[k] = data[k];
	}

	async fetch() {
		var data = await this.#store.getID(this.id);
		for(var k in KEYS) this[k] = data[k];

		return this;
	}

	async save(embed = false) {
		var obj = await this.verify();

		var data;
		if(this.id) data = await this.#store.update(this.id, obj, embed);
		else data = await this.#store.create(this.server_id, obj);
		for(var k in KEYS) this[k] = data[k];
		return this;
	}

	async delete() {
		await this.#store.delete(this.id);
		this.deleted = true;
	}

	async buildEmbed() {
		var user = await this.#store.bot.users.fetch(this.user_id);

		return {
			title: this.title,
			description: this.description,
			color: parseInt(this.active ? "55aa55" : "aa5555", 16),
			fields: this.choices.map((o, i) => {
				var count = o.voters?.length ?? 0;
				return {
					name: `${strings.pollnumbers[i+1]} ${o.option}`, 
					value: count !== 1 ? `${count} voters` : `1 voter`
				}
			}),
			footer: {
				text: `ID: ${this.hid}`
			},
			author: {
				name: `${user.username}#${user.discriminator}`,
				icon_url: `${user.avatarURL()}`
			},
			timestamp: this.start_time.toISOString()
		}
	}

	async verify(patch = true /* generate patch-only object */) {
		var obj = {};
		var errors = []
		for(var k in KEYS) {
			if(!KEYS[k].patch && patch) continue;
			if(this[k] == undefined) continue;
			if(this[k] == null) {
				obj[k] = this[k];
				continue;
			}

			var test = true;
			if(KEYS[k].test) test = await KEYS[k].test(this[k]);
			if(!test) {
				errors.push(KEYS[k].err);
				continue;
			}
			if(KEYS[k].transform) obj[k] = KEYS[k].transform(this[k]);
			else obj[k] = this[k];
		}

		if(errors.length) throw new Error(errors.join("\n"));
		return obj;
	}
}

class PollStore {
	constructor(bot, db) {
		this.db = db;
		this.bot = bot;
	}

	async init() {
		await this.db.query(`
			CREATE TABLE IF NOT EXISTS polls (
				id 			SERIAL PRIMARY KEY,
				hid 		TEXT,
				server_id 	TEXT,
				channel_id  TEXT,
				message_id  TEXT,
				user_id 	TEXT,
				title 		TEXT,
				description	TEXT,
				choices 	JSONB,
				active 		BOOLEAN,
				start_time	TIMESTAMPTZ,
				end_time 	TIMESTAMPTZ,
				multi 		BOOLEAN
			);
		`)

		this.bot.on('interactionCreate', (ctx) => {
			if(!ctx.isButton()) return;

			this.handleButtons(ctx)
		})

		this.bot.on('messageDelete', async (msg) => {
			await this.deleteByMessage(
				msg.guild.id,
				msg.channel.id,
				msg.id
			)
		})

		this.bot.on('messageDeleteBulk', async (msgs) => {
			var arr = msgs.map(x => x);
			for(var msg of arr) {
				await this.deleteByMessage(
					msg.guild.id,
					msg.channel.id,
					msg.id
				)
			}
		})
	}

	async create(server, data = {}) {
		try {
			var obj = await (new Poll(this, data).verify(false));
			var data = await this.db.query(`INSERT INTO polls (
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
				end_time,
				multi
			) VALUES (find_unique('polls'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			RETURNING hid;`,
			[server, obj.channel_id, obj.message_id, obj.user_id,
			 obj.title || "unnamed", obj.description, JSON.stringify(obj.choices),
			 obj.active ?? true, obj.start_time ?? Date.now(), obj.end_time,
			 obj.multi])
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message ?? e);
		}

		return await this.get(server, data.rows[0].hid);
	}

	async get(server, hid) {
		try {
			var data = await this.db.query(`SELECT * FROM polls WHERE server_id = $1 AND hid = $2`, [server, hid])
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		if(data.rows && data.rows[0]) {
			return new Poll(this, data.rows[0]);
		} else return new Poll(this, {server_id: server});
	}

	async getID(id) {
		try {
			var data = await this.db.query(`SELECT * FROM polls WHERE id = $1`, [id])
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		if(data.rows?.[0]) return new Poll(this, data.rows[0]);
		else return new Poll(this, {});
	}

	async getAll(server) {
		try {
			var data = await this.db.query(`SELECT * FROM polls WHERE server_id = $1`, [server])
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		if(data.rows && data.rows[0]) {
			return data.rows.map(t => new Poll(this, t));
		} else return undefined;
	}

	async update(id, data = {}, embed = false) {
		try {
			await this.db.query(`UPDATE polls SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE id = $1`,[id, ...Object.values(data)]);
			var poll = await this.getID(id);
			if(embed) await this.updateEmbed(poll)
		} catch(e) {
			console.log(e);
			return Promise.reject(e.message);
		}

		return poll;
	}

	async delete(id) {
		try {
			await this.db.query(`DELETE FROM polls WHERE id = $1`, [id])
		} catch(e) {
			return Promise.reject(e.message);
		}

		return;
	}

	async deleteByMessage(server, channel, message) {
		try {
			await this.db.query(`
				DELETE FROM polls 
				WHERE server_id = $1 AND
				channel_id = $2 AND
				message_id = $3
			`, [server, channel, message])
		} catch(e) {
			return Promise.reject(e.message);
		}

		return;
	}
	
	async deleteAll(server) {
		try {
			await this.db.query(`DELETE FROM polls WHERE server_id = $1`, [server])
		} catch(e) {
			return Promise.reject(e.message);
		}

		return;
	}

	async updateEmbed(poll) {
		var {
			message_id: mid,
			channel_id: chid,
			server_id: sid,
			user_id: uid
		} = poll;

		try {
			var server = await this.bot.guilds.fetch(sid);
			var channel = await server.channels.fetch(chid);
			var msg = await channel.messages.fetch(mid);
			var user = await this.bot.users.fetch(uid);

			var components;
			if(poll.active) {
				components = strings.pollButtons.map(b => ({
					...b,
					custom_id: `poll-${poll.hid}-${b.custom_id}`
				}))
			} else {
				components = [{
					type: 2,
					label: 'Delete',
					emoji: '🗑️',
					style: 4,
					custom_id: `poll-${poll.hid}-delete`
				}]
			}
			await msg.edit({
				embeds: [{
					title: poll.title,
					description: poll.description,
					fields: poll.choices.map((o, i) => {
						var count = o.voters?.length ?? 0;
						return {
							name: `${strings.pollnumbers[i+1]} ${o.option}`, 
							value: count !== 1 ? `${count} voters` : `1 voter`
						}
					}),
					color: parseInt(poll.active ? '55aa55' : 'aa5555', 16),
					footer: {
						text: `ID: ${poll.hid}`
					},
					author: {
						name: `${user.username}#${user.discriminator}`,
						icon_url: `${user.avatarURL()}`
					},
					timestamp: poll.start_time
				}],
				components: [{
					type: 1,
					components
				}]
			})
		} catch(e) {
			return Promise.reject(e);
		}
		
	}

	async handleButtons(ctx) {
		var { customId, user } = ctx;
		if(!customId.startsWith('poll')) return;
		var frags = customId.split('-');
		var hid = frags[1];
		var type = frags[2];

		var poll = await this.get(ctx.guild.id, hid);
		if(!poll.id) return await ctx.reply({
			content: "That poll has been deleted!",
			ephemeral: true
		})

		var msg;
		await ctx.deferReply({ephemeral: true});
		switch(type) {
			case 'view':
				var existing = poll.choices.filter(c => c.voters?.includes(user.id));
				if(!existing?.length) msg = "You haven't voted for this poll yet";
				else {
					msg = "Your vote:\n" +
						existing.map(o => o.option)
						.join('\n');
				}
				break;
			case 'edit':
				if (poll.user_id !== user.id)
					return await ctx.followUp({
						content: "This poll doesn't belong to you",
						ephemeral: true
					})
				
				var edit = await this.bot.utils.awaitSelection(ctx, EDIT, "What do you want to edit?", {
					min_values: 0, max_values: 1,
					placeholder: 'Select what to edit',
					ephemeral: true
				})
				if(!Array.isArray(edit)) return await ctx.followUp({
					content: "Action cancelled!",
					ephemeral: true
				})

				edit = edit[0]
				await ctx.followUp({
					content: 'Enter the new ' + edit,
					ephemeral: true
				})
				var resp = await ctx.channel.awaitMessages({
					filter: m => m.author.id == ctx.user.id,
					max: 1,
					time: 3 * 60 * 1000
				})
				if(!resp?.first()) return await ctx.followUp({
					content: "Action cancelled!",
					ephemeral: true
				})

				var content = resp.first().content;
				poll[edit] = content;
				await resp.first().delete();
				msg = "Poll updated!"
				break;
			case 'close':
				if (poll.user_id !== user.id && !ctx.member.permissions.has('MANAGE_MESSAGES')) {
					return await ctx.followUp({
						content: "You don't have permission to close that poll",
						ephemeral: true
					})
				}

				var reply = await ctx.followUp({
					content: "Are you sure you want to close this poll?",
					ephemeral: true,
					components: [{
						type: 1,
						components: BUTTONS
					}]
				})

				var conf = await this.bot.utils.getConfirmation(this.bot, reply, user);
				if(conf.msg) return await ctx.followUp({
					content: 'Action cancelled!',
					ephemeral: true
				});
				poll.active = false;
				msg = "Poll closed!";
				break;
			case 'vote':
				var votes = await this.bot.utils.awaitSelection(ctx, poll.choices.map((c, i) => {
					return {
						label: c.option,
					    value: `${i}`,
					    emoji: strings.pollnumbers[i+1],
					    default: c.voters?.includes(user.id)
					}
				}), "What do you want to vote for?", {
					min_values: 0, max_values: poll.multi ? poll.choices.length : 1,
					placeholder: 'Select vote',
					ephemeral: true
				})
				if(typeof votes == 'string') return votes;

				poll.choices = poll.choices.map(c => ({
					...c,
					voters: c.voters.filter(x => x !== user.id)
				}))
				for(var i = 0; i < poll.choices.length; i++) {
					if(votes.includes(`${i}`)) 
						poll.choices[i].voters.push(user.id);
				}

				msg = "Your vote has been cast!";
				break;
			case 'delete':
				if (poll.user_id !== user.id && !ctx.member.permissions.has('MANAGE_MESSAGES')) {
					return await ctx.followUp({
						content: "You don't have permission to delete that poll",
						ephemeral: true
					})
				}
				
				var reply = await ctx.followUp({
					content: "Are you **sure** you want to delete this poll? **This action can't be undone!**",
					ephemeral: true,
					components: [{
						type: 1,
						components: BUTTONS
					}]
				})
				var conf = await this.bot.utils.getConfirmation(this.bot, reply, user);
				if(conf.msg) return await ctx.followUp({
					content: 'Action cancelled!',
					ephemeral: true
				});
				await poll.delete()
				await ctx.message.delete();
				msg = "Poll deleted!";
				break;
		}

		if(!poll.deleted) await poll.save(true);
		await ctx.followUp({
			content: msg,
			ephemeral: true
		})
	}
}

module.exports = {
	Poll,
	store: (bot, db) => new PollStore(bot, db)
}