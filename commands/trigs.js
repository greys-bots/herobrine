module.exports= {
		help: "List, register, add, and remove triggers.",
		usage: [" - List your trigger lists, if you have any.",
						" [code] - List triggers registered at that code.",
						" new - Creates a new list, using a handy menu.",
						" add [code] <triggers, to, add> - Adds triggers to a list. If no triggers are given, runs a menu.",
						" remove [code] <triggers, to, remove> - Removes triggers from a list. If no triggers are given, runs a menu.",
						" delete [code] - Deletes a trigger list."],
		examples: ["hh!trigs", 
					"hh!trigs 3f6h", 
					"hh!trigs new", 
					"hh!trigs add 36fh blood", 
					"hh!trigs remove 36fh blood", 
					"hh!delete 36fh"],
		module: "utility",
		subcommands: {}
	}

module.exports.subcommands.new = {
	help: "Creates a new trigger list.",
	usage: [" - Opens a menu for creating a new list"],
	examples: ["hh!trigs new"]
}
module.exports.subcommands.add = {
	help: "Add new triggers.",
	usage: [" [listID] <stuff, to, add> - Adds new triggers. Uses a menu if no triggers are given in the command."],
	examples: ["hh!trigs add trgs", "hh!trigs add trgs stuff, other stuff"]
}
module.exports.subcommands.remove = {
	help: "Remove existing triggers.",
	usage: [" [listID] <stuff, to, remove> - Removes triggers from a list. Runs a menu if triggers aren't specified."],
	examples: ["hh!trigs remove trgs", "hh!trigs remove trgs other stuff, more stuff"]
}
module.exports.subcommands.delete = {
	help: "Delete a trigger list.",
	usage: [" [code] - Delete a trigger list with code [code]."],
	examples: ["hh!trigs delete trgs"]
}