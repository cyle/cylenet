var net = require('net');

var wins_server_port = 21335;
var ask_for = 'cyle.lol';

var client = net.connect({host: 'localhost', port: wins_server_port}, function() { //'connect' listener
	console.log('client connected');
	console.log('request: '+ask_for);
	client.write(ask_for+'\n');
});

client.on('data', function(data) {
	console.log(data.toString());
	client.end();
});

client.on('end', function() {
	console.log('client disconnected');
});