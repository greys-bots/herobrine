const VALS = {
	open: ['on', 'open', 'true', '1'],
	close: ['off', 'closed', 'close', 'false', '0']
}

module.exports = {
	help: ()=> "Sets whether the bot owner backdoor is open or not.",
	usage: ()=> [
		" - Views backdoor status.",
		` ${VALS.open.join(" | ")} - Opens the backdoor.`,
		` ${VALS.close.join(" | ")} - Closes the backdoor.`
	],
	desc: ()=>
		"The backdoor controls whether the bot's devs/owners can " +
		"bypass permission restrictions. This door is CLOSED by default and must be " +
		"opened by a server admin before it can be used.",
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!args[0]) {
			return `Current backdoor status: ${cfg?.backdoor ? 'OPEN' : 'CLOSED'}`
		}

		switch(true) {
			case VALS.open.includes(args[0]):
				cfg.backdoor = true;
				break;
			case VALS.close.includes(args[0]):
				cfg.backdoor = false;
				break;
			default:
				return 'Invalid value. Please try again';
		}

		try {
			await bot.stores.configs.update(msg.guild.id, {backdoor: cfg.backdoor})
		} catch (e) {
			return `ERR: ${e}`;
		}

		return `Backdoor ${cfg.backdoor ? 'opened!' : 'closed!'}`
	},
	guildOnly: true,
	permissions: ['manageGuild'],
	alias: ['bd', 'devdoor']
}