var conv = require("./binding_duktape");

var mod = {

//return 
convert:function(src, idls){
	var ret = "";
	for(var i=0;i<idls.length;i++){
		var iface = idls[i]; 
		ret += conv.convertDukObject(iface);	
	}
	return ret;
}

};

module.exports = mod;

