var fs = require('fs');
var dblite = require('dblite');
var {Pool} = require('pg');

module.exports = async (bot) => {
	// db = dblite("./data.sqlite","-header");
	const db = new Pool();

	await db.query(`
		CREATE TABLE IF NOT EXISTS aliases (
			id 			SERIAL PRIMARY KEY,
			server_id 	TEXT,
			name 		TEXT,
			command 	TEXT
		);

		CREATE TABLE IF NOT EXISTS bundles (
			id 			SERIAL PRIMARY KEY,
			hid 		TEXT,
			server_id 	TEXT,
			name 		TEXT,
			description TEXT,
			roles 		TEXT[],
			assignable 	BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS commands (
			id 			SERIAL PRIMARY KEY,
			server_id 	TEXT,
			name 		TEXT,
			actions 	JSONB,
			target 		TEXT,
			del 		BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS configs (
			id 			SERIAL PRIMARY KEY,
			server_id 	TEXT,
			prefix 		TEXT,
			autoroles 	TEXT[],
			disabled 	JSONB,
			opped 		TEXT[],
			logged 		TEXT[],
			starboard 	INTEGER,
			backdoor	BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS feedback_configs (
			id 			SERIAL PRIMARY KEY,
			server_id 	TEXT,
			channel_id	TEXT,
			anon 		BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS feedback (
			id			SERIAL PRIMARY KEY,
			hid			TEXT,
			server_id	TEXT,
			sender_id 	TEXT,
			message 	TEXT,
			anon 		BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS notes (
			id 			SERIAL PRIMARY KEY,
			hid 		TEXT,
			user_id 	TEXT,
			title 		TEXT,
			body 		TEXT
		);

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
			end_time 	TIMESTAMPTZ
		);

		CREATE TABLE IF NOT EXISTS profiles (
			id 			SERIAL PRIMARY KEY,
			user_id 	TEXT,
			title 		TEXT,
			bio 		TEXT,
			color 		TEXT,
			badges 		JSONB,
			lvl 		TEXT,
			exp 		TEXT,
			cash 		TEXT,
			daily 		TIMESTAMPTZ,
			disabled 	BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS reactcategories (
	    	id 				SERIAL PRIMARY KEY,
	    	hid 			TEXT,
	    	server_id		TEXT,
	    	name 			TEXT,
	    	description 	TEXT,
	    	roles 			TEXT[],
	    	posts 			TEXT[],
	    	single 			BOOLEAN,
	    	required 		TEXT
	    );

	    CREATE TABLE IF NOT EXISTS reactposts (
			id				SERIAL PRIMARY KEY,
			server_id		TEXT,
			channel_id		TEXT,
			message_id		TEXT,
			category 		TEXT,
			roles			TEXT[],
			page 			INTEGER,
	    	single 			BOOLEAN,
	    	required 		TEXT
		);

	    CREATE TABLE IF NOT EXISTS reactroles (
	    	id 				SERIAL PRIMARY KEY,
	    	server_id		TEXT,
	    	role_id 		TEXT,
	    	emoji 			TEXT,
	    	description 	TEXT
	    );

		CREATE TABLE IF NOT EXISTS reminders (
			id 			SERIAL PRIMARY KEY,
			hid 		TEXT,
			user_id 	TEXT,
			note 		TEXT,
			time 		TIMESTAMPTZ,
			recurring 	BOOLEAN,
			interval	JSONB
		);

		CREATE TABLE IF NOT EXISTS responses (
			id 			SERIAL PRIMARY KEY,
			server_id	TEXT,
			name 		TEXT,
			value 		TEXT[]
		);

		CREATE TABLE IF NOT EXISTS roles (
			id 			SERIAL PRIMARY KEY,
			server_id 	TEXT,
			role_id 	TEXT,
			description TEXT,
			assignable 	BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS starboards (
			id 			SERIAL PRIMARY KEY,
			server_id 	TEXT,
			channel_id	TEXT,
			emoji		TEXT,
			override	BOOLEAN,
			tolerance	INTEGER
		);

		CREATE TABLE IF NOT EXISTS starred_messages (
			id 			SERIAL PRIMARY KEY,
			server_id	TEXT,
			channel_id	TEXT,
			message_id 	TEXT,
			original_id TEXT,
			emoji 		TEXT
		);

		CREATE TABLE IF NOT EXISTS strikes (
			id 			SERIAL PRIMARY KEY,
			hid 		TEXT,
			server_id 	TEXT,
			user_id 	TEXT,
			reason 		TEXT
		);

		CREATE TABLE IF NOT EXISTS triggers (
			id 			SERIAL PRIMARY KEY,
			hid 		TEXT,
			user_id 	TEXT,
			name 		TEXT,
			list 		JSONB,
			private		BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS welcome_configs (
			id 			SERIAL PRIMARY KEY,
			server_id	TEXT,
			preroles	TEXT[],
			postroles	TEXT[],
			channel 	TEXT,
			message 	TEXT,
			enabled		BOOLEAN
		);
	`);

	// not ready yet
	// db.query(`CREATE TABLE IF NOT EXISTS invites (
	// 	id 			SERIAL PRIMARY KEY,
	// 	server_id 	TEXT,
	// 	invite_id 	TEXT,
	// 	name 		TEXT
	// )`);

	// db.query(`CREATE TABLE IF NOT EXISTS logging_configs (
	// 	id 			SERIAL PRIMARY KEY,
	// 	server_id 	TEXT,
	// 	channel_id	TEXT,
	// 	events	 	TEXT
	// )`);
	
	bot.stores = {};
	var files = fs.readdirSync(__dirname);
	for(var file of files) {
		if(["__db.js", "__migrations.js", "tmp.js"].includes(file)) continue;
		var tmpname = file.replace(/store\.js/i, "");
		var name =  tmpname[0].toLowerCase() + tmpname.slice(1);
		if(tmpname.endsWith('y')) name = name.slice(0, -1) + "ies"; //ReactCategoryStore.js becomes reactCategories
		else if(tmpname.endsWith('s')) name += "es"; //AliasStore.js becomes aliases
		else name += "s"; //ProfileStore.js becomes profiles

		bot.stores[name] = require(__dirname+'/'+file)(bot, db);
		if(bot.stores[name].init) bot.stores[name].init();
	}

	return db;
}