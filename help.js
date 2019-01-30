module.exports={
	help: {
		"title":"NORMAL COMMANDS",
		"description":"Commands usable by everyone.",
		"color":16755455,
		"fields":[
			{"name":"**Affirming**",
				"value":"`I love you` - If you tell me you love me, I'll let you know that I love you too!\n"+
				"`Am I real?` - Of course you are, and I'll tell you just that.\n"+
				"`Lovebomb` - I'll tell you some mushy things that everyone deserves to hear."
			},
			{"name":"**Practical**",
				"value":"`Notes` - This one is complicated. Use heysteve notes help to get help for it.\n"+
				"`Role` - Syntax: heysteve role [add/remove] [role|name]. Use heysteve role by itself to get more details.\n"+
				"`Trigs` - This command is a bit complicated, so it's best to just type heysteve trigs in order to get the information on it.\n"+
				"`Profile` - Syntax: heysteve profile [@person]. Using heysteve profile alone will offer a menu to edit your profile.\n"+
				"`Resources` - This one comes with a handy menu! Just type heysteve resources to use it.\n"+
				"`Feedback` - This command sends feedback to the dev. Usage: heysteve feedback [message]"
			},
			{"name":"**Fun**",
				"value":"`Daily` - Used to get the daily 200 bucks. And then some.\n"+
				"`Bank` - Used to see what you've collected thus far.\n"+
				"`Flip` - I'll flip a coin.\n"+
				"`Random` - I'll generate a random number between 0 and what you put in.\n"+
				"`Extra` - You're gay/I'm gay/you're cute/you're adorable/vore/oof"
			},
		],
		"footer":{
			"icon_url":"https://cdn.discordapp.com/avatars/486525763252649985/d674fd06a6fd5617b1dbfba01ae139b3.jpg",
			"text":"[this] = required; <this> = optional. Don't include brackets in commands!"
		}
	},
	help2: {
		"title":"NORMAL COMMANDS",
		"description":"Commands usable by everyone.\nDefault prefixes: \"hh!command\", \"heyherobrine command\", \"heyhero command\"",
		"color":16755455,
		"fields":[
			{
				"name":"Util",
				"value":[
							"**hh!help** or **hh!h** - *returns this help message*",
							"**hh!trigs** - *used for indexing triggers. use `hh!trigs help` for more info*",
							"**hh!random [number]** - *gives a random number*",
							"**hh!roles** - *lists all roles in the server*",
							"**hh!role** - *add and remove self roles*"
						].sort().join("\n")
			},
			{
				"name":"Fun",
				"value":[
							"**hh!what's up(?)** or **hh!whats up(?)** - *ask him what's up!*",
							"**hh!ping** - *pong!*",
							"**hh!lovebomb** - *get a bomb of love*"
						].sort().join("\n")
			}
		],
		"footer":{
			"icon_url":"https://cdn.discordapp.com/avatars/486525763252649985/d674fd06a6fd5617b1dbfba01ae139b3.jpg",
			"text":"[this] = required; <this> = optional. Don't include brackets in commands!"
		}
	},
	adhelp: {
		"title":"ADMIN COMMANDS",
		"description":"Commands useable by admins only.",
		"color":16755455,
		"fields":[
			{"name":"\u200B","value":"\u200B"},
			{"name":"*Role*","value":"Add, remove, etc roles.\n**sub-args:** init, add, remove, edit (color and name), new, delete"},
			{"name":"*Strikes*","value":"Edit a person's strike count.\n**sub-args:** add, remove, set"},
			{"name":"*Bundles*","value":"Edit role bundles for the server.\n**sub-args:** new, delete, add, remove"},
			{"name":"*Welcome*","value":"Give users set welcome roles and display a set welcome message!\n**usage:** heysteve * welcome [@ user]"},
			{"name":"*Edit*","value":"Enable/disable mod commands, etc.\n**sub-args**: mod (1 or 0), welcome (1 or 0 for en/disable, message, channel, roles)"},
			{"name":"*Enable*","value":"Enable commads that have been disabled. Send without arguments for a list of all useable commands."},
			{"name":"*Disable*","value":"Disable commands. Send without arguments for a list of all useable commands."},
			{"name":"*Init*","value":"Initiate roles for self-rolablility. Argument 1 is the role name, argument 2 is a 1 for self-rolable and 0 for only mod-rolable."},
			{"name":"*Promote*","value":"Promote users to bot admins in the server. Works internally, without roles"},
			{"name":"*Demote*","value":"Gave a user too much Steve power? That's okay, use this to nerf 'em"},
			{"name":"*Emoji*","value":"Remotely add or remove emoji.\n**sub-args:** add, delete"}

		],
		"footer":{
			"icon_url":"https://cdn.discordapp.com/avatars/486525763252649985/d674fd06a6fd5617b1dbfba01ae139b3.jpg",
			"text":"[this] = required; <this> = optional. Don't include brackets in commands!"
		}
	},
	trigs: {
		"title":"TRIGGERS",
		"description":"Used for indexing trigger lists.",
		"color":16755455,
		"fields":[
		{"name":"Usage","value":"hh!trigs new - *runs setup for a new list*\n"+
		"hh!trigs [list ID] - *views indicated list*\n"+
		"hh!trigs add [list ID] <separated, things, to, add> - *adds to the trigger list; sends a message asking for triggers to add if no arguments are present*\n"+
		"hh!trigs remove [list ID] <separated, things, to, remove> - *removes from the trigger list; sends a message asking for triggers to remove if no arguments are present*\n"+
		"hh!trigs delete [list ID] - *deletes indicated list*\n"+
		"hhh!trigs help - *views this help text*\n"+
		"\n\n**NOTE:** `hh!trigs remove` will delete a list automatically if all triggers are removed"
		}
		],
		"footer":{
			"icon_url":"https://cdn.discordapp.com/avatars/486525763252649985/d674fd06a6fd5617b1dbfba01ae139b3.jpg",
			"text":"[this] = required; <this> = optional. Don't include brackets in commands!"
		}
	}
}