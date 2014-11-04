var tls = require('tls');
var fs = require('fs');

if (!String.prototype.trim) {
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

var request_host = '';
var request_string = '';

if (process.argv[2] == undefined) {
	console.log('no host given');
	process.exit(1);
} else {
	request_host = process.argv[2];
}

if (process.argv[3] == undefined) {
	request_string = 'ctp/1.0 req '+request_host+'/';
} else {
	request_string = process.argv[3];
}

var ctp_server_port = 21337;

// get IP of server from given hostname
var wins = require('../WiNS-SSL');

wins.getIP(request_host, function(wins_response) {
	// parse first 3 characters
	var wins_status = wins_response.substring(0, 3);
	
	if (wins_status * 1 == 100) {
		
		var wins_ip = wins_response.substring(4);
		
		console.log('IP for hostname ' + request_host + ' is ' + wins_ip);
		
		var options = {
			rejectUnauthorized: false
		};
		
		var cleartextStream = tls.connect(ctp_server_port, wins_ip, options, function() {
			console.log('client connected');
			console.log('connection is', cleartextStream.authorized ? 'authorized' : 'unauthorized');
			console.log('sending request: '+request_string);
			cleartextStream.write(request_string+'\n');
		});
		
		cleartextStream.setEncoding('utf8');
		
		cleartextStream.on('data', function(data) {
			console.log('got back: '+data.toString().trim());
			process.exit(0);
		});
		
		cleartextStream.on('end', function() {
			console.log('client disconnected');
		});
		
	} else if (wins_status * 1 == 404) {
		console.log('hostname not found');
	} else {
		console.log('cannot look up hostname');
	}
	
});