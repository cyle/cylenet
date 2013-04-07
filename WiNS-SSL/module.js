// WiNS client module

var tls = require('tls');
var fs = require('fs');

if (!String.prototype.trim) {
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

var wins_server_port = 21335;

exports.getIP = function(hostname, callback) {
		
	var options = {
		rejectUnauthorized: false	
	};
	
	var cleartextStream = tls.connect(wins_server_port, options, function() {
		//console.log('client connected');
		//console.log('connection is', cleartextStream.authorized ? 'authorized' : 'unauthorized');
		//console.log('request: '+hostname);
		cleartextStream.write(hostname+'\n');
	});
	
	cleartextStream.setEncoding('utf8');
	
	cleartextStream.on('data', function(data) {
		//console.log('got back: '+data.toString().trim());
		//process.exit(0);
		callback(data.toString().trim());
	});
	
	cleartextStream.on('end', function() {
		//console.log('client disconnected');
	});
	
};

