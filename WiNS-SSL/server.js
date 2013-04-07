var tls = require('tls');
var fs = require('fs');

if (!String.prototype.trim) {
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

var wins_addresses = [
	{ 'h': 'cyle.lol', 'ip': '127.0.0.1' },
	{ 'h': 'ohlol.dicks', 'ip': '127.0.0.1' }
];

var wins_server_port = 21335;

var options = {
	key: fs.readFileSync('../cylenet.key.pem'),
	cert: fs.readFileSync('../cylenet.crt.pem'),
};

var server = tls.createServer(options, function(c) {
	console.log('server connected', c.authorized ? 'authorized' : 'unauthorized');
	//c.write("welcome!\n");
	c.setEncoding('utf8');
	
	//c.pipe(c);
	
	c.on('end', function() {
		console.log('client disconnected');
	});
	
	c.on('data', function(data) {
		var request_string = data.toString().trim();
		var new_response = '';
		
		console.log('new request: ' + request_string);
		var found_record = false;
		for (var i = 0; i < wins_addresses.length; i++) {
			if (wins_addresses[i].h == request_string) {
				found_record = true;
				new_response = '100 ' + wins_addresses[i].ip;
			}
		}
		if (found_record == false) {
			new_response = '404';
		}
		
		console.log('new response: ' + new_response);
		c.write(new_response + '\n');
	});
	
});

server.listen(wins_server_port, function() {
	console.log('WiNS-SSL server bound and ready');
});
