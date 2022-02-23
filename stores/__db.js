var fs = require('fs');
var { Pool } = require('pg');

module.exports = async (bot) => {
	const db = new Pool();

	await db.query(`
		CREATE TABLE IF NOT EXISTS profiles (
			id 			SERIAL PRIMARY KEY,
			user_id		TEXT,
			title		TEXT,
			bio			TEXT,
			color		TEXT,
			badges		JSONB,
			lvl			TEXT,
			exp			TEXT,
			cash		TEXT,
			daily		TIMESTAMPTZ,
			disabled	BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS configs (
			id 			SERIAL PRIMARY KEY,
			server_id 	TEXT,
			prefix 		TEXT,
			autoroles 	TEXT[],
			disabled 	JSONB,
			opped 		TEXT[],
			backdoor	BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS extras (
			id 			SERIAL PRIMARY KEY,
			key 		TEXT,
			val 		TEXT
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

		CREATE OR REPLACE FUNCTION gen_hid() RETURNS TEXT AS
			'select lower(substr(md5(random()::text), 0, 5));'
		LANGUAGE SQL VOLATILE;
		
		CREATE OR REPLACE FUNCTION find_unique(_tbl regclass) RETURNS TEXT AS $$
			DECLARE nhid TEXT;
			DECLARE res BOOL;
			BEGIN
				LOOP
					nhid := gen_hid();
					EXECUTE format(
						'SELECT (EXISTS (
							SELECT FROM %s
							WHERE hid = %L
						))::bool',
						_tbl, nhid
					) INTO res;
					IF NOT res THEN RETURN nhid; END IF;
				END LOOP;
			END
		$$ LANGUAGE PLPGSQL VOLATILE;
	`);

	bot.stores = {};
	var files = fs.readdirSync(__dirname);
	for(var file of files) {
		if(["__db.js", "migrations"].includes(file)) continue;
		var name = file.slice(0, -3);
		bot.stores[name] = require(__dirname+'/'+file).store(bot, db);
		if(bot.stores[name].init) bot.stores[name].init();
	}

	files = fs.readdirSync(__dirname + '/migrations');
	files = files.sort((a, b) => {
		a = parseInt(a.slice(0, -3));
		b = parseInt(b.slice(0, -3));

		return a - b;
	})
	var version = parseInt((await db.query(`SELECT * FROM extras WHERE key = 'version'`)).rows[0]?.val || -1);
	if(files.length > version + 1) {
		for(var i = version + 1; i < files.length; i++) {
			if(!files[i]) continue;
			var migration = require(`${__dirname}/migrations/${files[i]}`);
			try {
				await migration(bot, db);
			} catch(e) {
				console.log(e);
				process.exit(1);
			}

			if(version == -1) await db.query(`INSERT INTO extras (key, val) VALUES ('version', 0)`);
			else await db.query(`UPDATE extras SET val = $1 WHERE key = 'version'`, [i]);
		}
	}

	return db;
}