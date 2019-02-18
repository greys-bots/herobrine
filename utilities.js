module.exports = {
	hex2rgb: (hex)=>{
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
	        return r + r + g + g + b + b;
	    });

		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
	},
	toLit: function(str,torep,repwith){
		if(str.indexOf(torep)!==-1){
			var repd=str.replace(torep,repwith);
			return eval('`'+repd+'`');
		} else {
			console.log("Nothing to replace.");
			return eval('`'+str+'`');
		}
	},
	cleanText: function(text){
		if (typeof(text) === "string") {
			return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
		} else	{
			return text;
		}
	},
	genCode: (num,table) =>{
		var codestring="";
		var codenum=0;
		while (codenum<(num==undefined ? 4 : num)){
			codestring=codestring+table[Math.floor(Math.random() * (table.length))];
			codenum=codenum+1;
		}
		return codestring;
	},
	randomText: function(table){
		var r=Math.floor(Math.random() * table.length);
		return table[r];
	},
	asyncForEach: async function(array,callback){
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
	},
	reloadConfig: async function(bot, srv){
		bot.db.query(`SELECT * FROM configs WHERE srv_id='${srv}'`,(err,rows)=>{
			if(err){
				console.log(err)
			} else {
				bot.server_configs[srv] = rows[0] ? rows[0] : {srv_id: srv, prefix: undefined, welcome: undefined, autoroles: undefined, disabled: undefined, opped: undefined, fedback: undefined};
			}
		})
	},
	checkDisabled: function(bot, srv, cmds){
		if(bot.server_configs[srv] && bot.server_configs[srv].disabled){
			console.log(cmds[1]);
			console.log(cmds[0].cmd.module)
			console.log(cmds[0].name)
			var dislist = JSON.parse(bot.server_configs[srv].disabled) || bot.server_configs[srv].disabled;
			if(dislist.modules && dislist.modules.includes(cmds[0].cmd.module)){
				console.log("Module disabled.")
				return true;
			} else if(dislist.commands && dislist.commands[cmds[0].name]){
				if(dislist.commands[cmds[0].name].includes("all")){
					console.log("Complete command disabled.")
					return true;
				} else if(cmds[1]){
					if(dislist.commands[cmds[0].name].includes(cmds[1].name)){
						console.log("Subcommand disabled.")
						return true;
					} else {
						console.log("Subcommand enabled.")
						return false;
					}
				} else {
					console.log("Base command enabled.")
					return false;
				}
			} else {
				console.log("Command nor module found.");
				return false;
			}
		} else {
			console.log("Nothing disabled.")
			return false;
		}
	},
	checkPermissions: async function(bot, msg, cmd){
		if(cmd.cmd.permissions){
			await Promise.all(cmd.cmd.permissions.map(p=>{
				if(msg.member.permission.has(p)){
					return new Promise((res,rej)=>{
						setTimeout(res("passed"),100)
					})
				} else {
					return new Promise((res,rej)=>{
						setTimeout(rej("failed"),100)
					})
				}
			}))
		} else {
			return new Promise(res => res(true));
		}
	}
};