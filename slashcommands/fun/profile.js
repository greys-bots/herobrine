const { confBtns } = require('../../extras');

module.exports = {
	data: {
		name: 'profile',
		description: "Manage and show off your profile",
		type: 2
	}
}

var opts = module.exports.options = [];

opts.push({
	data: {
		name: 'view',
		description: "View your profile or someone else's",
		type: 1,
		options: [{
			name: 'user',
			description: "A user to view the profile of",
			type: 6,
			required: false
		}]
	},
	usage: [
		'- View your own profile',
		"[user] - View another user's profile"
	],
	async execute(ctx) {
		var { client: bot } = ctx;
		var u = ctx.options.getUser('user');
		var user = u ?? ctx.user;

		var profile = await bot.stores.profiles.get(user.id);

		return {embeds: [{
			title: profile.name || "untitled user profile",
			description: profile.description || "(not set)",
			author: {
				name: user.tag,
				icon_url: user.avatarURL({format: "png", dynamic: true})
			},
			color: parseInt(profile.color, 16) || parseInt("aaaaaa", 16),
			fields: [
				{name: "Level", value: (profile.level).toString(), inline: true},
				{name: "Experience", value: (profile.exp).toString(), inline: true}
			],
			footer: {
				text: `Level-up messages ${profile.disabled ? "are" : "are not"} disabled for this user`
			}
		}]}
	}
})

opts.push({
	data: {
		name: 'title',
		description: "Set your profile title",
		type: 1,
		options: [{
			name: 'title',
			description: "The title to set",
			type: 3,
			required: true
		}]
	},
	usage: [
		"[title] - Set your profile title"
	],
	async execute(ctx) {
		var { client: { stores } } = ctx;
		var title = ctx.options.getString('title').trim();
		if(title.length > 100) return "Title too long; must be 100 characters or less";

		var profile = await stores.profiles.get(ctx.user.id);
		profile.name = title;
		await profile.save();

		return "Title saved!";
	}
})

opts.push({
	data: {
		name: 'description',
		description: "Set your profile description",
		type: 1,
		options: [{
			name: 'description',
			description: "The description to set",
			type: 3,
			required: true
		}]
	},
	usage: [
		"[description] - Set your profile description"
	],
	async execute(ctx) {
		var { client: { stores } } = ctx;
		var desc = ctx.options.getString('description').trim();
		if(desc.length > 250) return "Description too long; must be 250 characters or less";

		var profile = await stores.profiles.get(ctx.user.id);
		profile.description = desc;
		await profile.save();

		return "Description saved!";
	}
})

opts.push({
	data: {
		name: 'delete',
		description: "Delete your profile information",
		type: 1
	},
	usage: [
		"- Completely delete your profile"
	],
	async execute(ctx) {
		var { client: { stores } } = ctx;
		var profile = await stores.profiles.get(ctx.user.id);
		if(!profile.id) return "No profile data to delete";

		var rdata = {
			content: "Are you **sure** you want to delete your profile? **This can't be undone!**",
			components: [
				{
					type: 1,
					components: confBtns
				}
			]
		}
		await ctx.reply(rdata);

		var reply = await ctx.fetchReply();
		var conf = await ctx.client.utils.getConfirmation(ctx.client, reply, ctx.user);
		var msg;
		if(conf.msg) {
			msg = conf.msg;
		} else {
			await profile.delete();
			msg = 'Profile deleted!';
		}

		if(conf.interaction) {
			await conf.interaction.update({
				content: msg,
				embeds: [],
				components: [{
					type: 1,
					components: confBtns.map(b => {
						return {... b, disabled: true};
					})
				}]
			})
		} else {
			await ctx.editReply({
				content: msg,
				embeds: [],
				components: [{
					type: 1,
					components: confBtns.map(b => {
						return {... b, disabled: true};
					})
				}]
			})
		}

		return;
	}
})