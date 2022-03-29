const { confBtns: BTNS } = require('../../../extras.js');

module.exports = {
	data: {
		name: 'delete',
		description: 'Delete an existing note',
		type: 1,
		options: [{
			name: 'note',
			description: "The note to delete",
			type: 3,
			required: true,
			autocomplete: true
		}]
	},
	usage: [
		"[note] - Delete a note"	
	],
	async execute(ctx) {
		var id = ctx.options.getString('note').trim().toLowerCase();
		var note = await ctx.client.stores.notes.get(ctx.user.id, id);
		if(!note.id) return "Note not found!";

		var rdata = {
			content: "Are you **sure** you want to delete this note? **This can't be undone!**",
			components: [
				{
					type: 1,
					components: BTNS
				}
			]
		}

		var reply = await ctx.reply({...rdata, fetchReply: true});
		var conf = await ctx.client.utils.getConfirmation(ctx.client, reply, ctx.user);
		if(conf.msg) return conf.msg;
		
		await note.delete();
		return 'Note deleted!';
	},
	async auto(ctx) {
		var notes = await ctx.client.stores.notes.getAll(ctx.guild.id);
		var foc = ctx.options.getFocused();
		if(!notes?.length) return [];
		if(!foc) return notes.map(n => ({
			name: n.title,
			value: n.hid 
		}));
		foc = foc.toLowerCase().trim();

		return notes.filter(n =>
			n.hid.includes(foc) ||
			n.title.toLowerCase().includes(foc)
		).map(n => ({
			name: n.title,
			value: n.hid
		}))
	}
}