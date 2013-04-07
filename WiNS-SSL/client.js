var tls = require('tls');
var fs = require('fs');

if (!String.prototype.trim) {
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

var wins_server_port = 21335;
var ask_for = 'cyle.lol';

var options = {
	rejectUnauthorized: false	
};

var cleartextStream = tls.connect(wins_server_port, options, function() {
	console.log('client connected', cleartextStream.authorized ? 'authorized' : 'unauthorized');
	console.log('request: '+ask_for);
	cleartextStream.write(ask_for+'\n');
});

cleartextStream.setEncoding('utf8');

cleartextStream.on('data', function(data) {
	console.log('got back: '+data.toString().trim());
});

cleartextStream.on('end', function() {
	console.log('client disconnected');
});