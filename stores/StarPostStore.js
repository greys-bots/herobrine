const {Collection} = require("discord.js");
const fetch = require("node-fetch");

class StarPostStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async init() {
		this.bot.on("messageReactionAdd", (...args) => {
			try {
				this.handleReactions(...args)
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageReactionRemove", async (...args) => {
			try {
				this.handleReactionRemove(...args);
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageReactionRemoveAll", async (msg) => {
			try {
				this.handleReactionRemove(msg, "bulk");
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageDelete", async (msg) => {
			try {
				this.delete(msg.channel.guild.id, msg.id);
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageBulkDelete", async (msgs) => {
			try {
				for(var msg of msgs) this.delete(msg.channel.guild.id, msg.id);
			} catch(e) {
				console.log(e);
			}
		})
	}

	async create(server, channel, msg, data = {}) {
		return new Promise(async (res, rej) => {
			var attachments = [];
			if(msg.attachments && msg.attachments[0]) {
				for(var i = 0; i < msg.attachments.length; i++) {
					var att = await fetch(msg.attachments[i].url);
					att = Buffer.from(await att.buffer());
					if(att.length > 8000000) continue;
					attachments.push({file: att, name: msg.attachments[i].filename});
				}
			}

			var embed = {
				author: {
					name: `${msg.author.username}#${msg.author.discriminator}`,
					icon_url: msg.author.avatarURL
				},
				footer: {
					text: msg.channel.name
				},
				description: (msg.content || "*(image only)*") + `\n\n[Go to message](https://discordapp.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`,
				timestamp: new Date(msg.timestamp).toISOString()
			};

			try {
				var message = await this.bot.createMessage(channel, {
					content: `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`,
					embed
				}, attachments[0] ? attachments : null);
				await this.db.query(`INSERT INTO starred_messages (
					server_id,
					channel_id,
					message_id,
					original_id,
					emoji
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, channel, message.id, msg.id, data.emoji])
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
		
			res(await this.get(server, message));
		})
	}

	//for migrations/indexing existing messages
	async index(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO starred_messages (
					server_id,
					channel_id,
					message_id,
					original_id,
					emoji
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, channel, message, data.original_id, data.emoji])
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
		
			res(await this.get(server, message));
		})
	}

	async get(server, message, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var post = super.get(`${server}-${message}`);
				if(post) return res(post);
			}

			try {
				//second line grabs the correct starboard and returns it
				//as a prop specifically called "starboard"
				var data = await this.db.query(`
					SELECT starred_messages.*, (
						SELECT row_to_json((SELECT a FROM (SELECT starboards.*) a))
						FROM starboards WHERE starboards.channel_id = starred_messages.channel_id
					) AS starboard FROM starred_messages WHERE server_id = $1 AND message_id = $2`,
					[server, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(`${server}-${message}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByOriginal(server, message) {
		return new Promise(async (res, rej) => {
			try {
				//second line grabs the correct starboard and returns it
				//as a prop specifically called "starboard"
				var data = await this.db.query(`
					SELECT starred_messages.*, (
						SELECT row_to_json((SELECT a FROM (SELECT starboards.*) a))
						FROM starboards WHERE starboards.channel_id = starred_messages.channel_id
					) AS starboard FROM starred_messages WHERE server_id = $1 AND original_id = $2`,
					[server, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`
					SELECT starred_messages.*, (
						SELECT row_to_json((SELECT a FROM (SELECT starboards.*) a))
						FROM starboards WHERE starboards.channel_id = starred_messages.channel_id
					) AS starboard FROM starred_messages WHERE server_id = $1`,
					[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, message, data = {}) {
		return new Promise(async (res, rej) => {
			//no database updates needed! yay!
			try {
				var post = await this.get(server, message);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			try {
				if(data.count > 0)
					this.bot.editMessage(
						post.channel_id,
						post.message_id,
						`${post.emoji.includes(":") ?
						`<${post.emoji}>` :
						post.emoji} ${data.count}`
					);
				else await this.delete(server, message);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}
			res();
		})
	}

	async delete(server, message) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM starred_messages WHERE server_id = $1 AND message_id = $2`, [server, message]);
				super.delete(`${server}-${message}`);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			res();
		})
	}

	async handleReactions(msg, emoji, user) {
		return new Promise(async (res, rej) => {
			try {
				msg = await this.bot.getMessage(msg.channel.id, msg.id);
			} catch(e) {
				if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
				return rej(e.message);
			}

			if(!msg.channel.guild) return res();

			emoji = emoji.id ? `:${emoji.name}:${emoji.id}` : emoji.name;
			var reaction = msg.reactions[emoji.replace(/^:/,"")];
			var board = await this.bot.stores.starboards.getByEmoji(msg.guild.id, emoji);
			if(!board) return res();
			var cfg = await this.bot.stores.configs.get(msg.guild.id);
			var tolerance;
			if(cfg) tolerance = cfg.starboard || 2;
			if(board.tolerance) tolerance = board.tolerance;
			var member = msg.guild.members.find(m => m.id == user);
			if(!member) return rej("Member not found");

			var post = await this.getByOriginal(msg.guild.id, msg.id);
			var scc;
			if(post) {
				scc = await this.update(msg.guild.id, post.message_id, {emoji: emoji, count: reaction ? reaction.count : 0})
			} else if(reaction.count >= tolerance || (board.override && member.permission.has("manageMessages"))) {
				scc = await this.create(msg.guild.id, board.channel_id, msg, {emoji: emoji, count: reaction ? reaction.count : 0})
			}
			res(scc);
		})
	}

	async handleReactionRemove(msg, emoji, user) {
		return new Promise(async (res, rej) => {
			var post = await this.getByOriginal(msg.channel.guild.id, msg.id);
			if(!post) return;

			try {
				msg = await this.bot.getMessage(msg.channel.id, msg.id);
			} catch(e) {
				if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
				return rej(e.message);
			}

			if(emoji != "bulk") {
				//not removeAll reaction event, so we need some extra logic
				var config = await this.bot.stores.configs.get(msg.channel.guild.id);
				if(config && config.blacklist && config.blacklist.includes(user)) return;

				var reaction = emoji.id ? `:${emoji.name}:${emoji.id}` : emoji.name;
				var count = msg.reactions[reaction.replace(/^:/,"")] ? msg.reactions[reaction.replace(/^:/,"")].count : 0;
				console.log(count);
				if(count > 0) {
					await this.update(post.server_id, post.message_id, {emoji: reaction, count});
					return;
				}
			}

			try {
				await this.bot.deleteMessage(post.channel_id, post.message_id);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res();
		})
	}
}

module.exports = (bot, db) => new StarPostStore(bot, db);
