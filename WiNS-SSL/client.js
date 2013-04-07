var tls = require('tls');
var fs = require('fs');

if (!String.prototype.trim) {
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

if (process.argv[2] == undefined) {
	console.log('no request given');
	process.exit(1);
} else {
	var ask_for = process.argv[2];
}

var wins_server_port = 21335;

var options = {
	rejectUnauthorized: false	
};

var cleartextStream = tls.connect(wins_server_port, options, function() {
	console.log('client connected');
	console.log('connection is', cleartextStream.authorized ? 'authorized' : 'unauthorized');
	console.log('request: '+ask_for);
	cleartextStream.write(ask_for+'\n');
});

cleartextStream.setEncoding('utf8');

cleartextStream.on('data', function(data) {
	console.log('got back: '+data.toString().trim());
	process.exit(0);
});

cleartextStream.on('end', function() {
	console.log('client disconnected');
});