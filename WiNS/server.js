var net = require('net');

var wins_addresses = [
	{ 'h': 'cyle.lol', 'ip': '127.0.0.1' },
	{ 'h': 'ohlol.dicks', 'ip': '127.0.0.1' }
];

var wins_server_port = 21335;

var server = net.createServer(function(c) { //'connection' listener
	console.log('client connected');
	c.setEncoding('utf8');
	//c.write('hello there!\r\n');
	
	c.on('end', function() {
		console.log('client disconnected');
	});
	
	c.on('data', function(data) {
		//c.write(data)
		var request_string = data.toString();
		request_string = request_string.replace(/\s/g, '');
		
		console.log('new request for: ' + request_string);
		var found_record = false;
		for (var i = 0; i < wins_addresses.length; i++) {
			if (wins_addresses[i].h == request_string) {
				found_record = true;
				console.log('found: '+wins_addresses[i].ip);
				c.write('100 ' + wins_addresses[i].ip + '\n');
			}
		}
		if (found_record == false) {
			console.log('not found');
			c.write('404' + '\n');
		}
	});
	
	//c.pipe(c);
});

server.listen(wins_server_port, function() { //'listening' listener
	console.log('WiNS server bound and ready');
	//console.log(wins_addresses);
});