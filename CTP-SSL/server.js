var tls = require('tls');
var fs = require('fs');
var path = require('path');

if (!String.prototype.trim) {
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

var ctp_server_port = 21337;
var ctp_file_root = '../ctproot';

var options = {
	key: fs.readFileSync('../cylenet.key.pem'),
	cert: fs.readFileSync('../cylenet.crt.pem'),
};

var server = tls.createServer(options, function(c) {
	
	var currentTime = new Date();
	console.log('client connected, ' + currentTime.toString());
	console.log('connection is', c.authorized ? 'authorized' : 'unauthorized');
	
	c.setEncoding('utf8');
	
	c.on('end', function() {
		var currentTime = new Date();
		console.log('client disconnected, ' + currentTime.toString());
	});
	
	c.on('data', function(data) {
		var currentTime = new Date();
		var request_string = data.toString().trim();
		var new_response_status = '';
		var new_response_body = '';
		
		console.log(currentTime.toString() + ' new request: ' + request_string);
		
		// break down request string
		var request_parts = request_string.split(' ');
		var ctp_action = request_parts[0];
		if (request_parts[0] == 'GET') {
			var file_path = '';
			var ctp_path = request_parts[1];
			ctp_path = path.normalize(ctp_path);
			console.log('new GET request for ' + ctp_path);
			if (ctp_path.charAt(0) != '/') {
				new_response_status = '502 BAD';
			} else {
				if (ctp_path == '/') {
					file_path = ctp_file_root + '/lol';
				} else {
					file_path = ctp_file_root + ctp_path;
				}
				if (fs.existsSync(file_path)) {
					new_response_status = '100 OK';
					new_response_body = fs.readFileSync(file_path, {encoding: 'utf8'});
				} else {
					new_response_status = '404 NOT';
				}
			}
		} else {
			console.log('error: no action given');
			new_response_status = '502 BAD';
		}
		
		console.log('new response: ' + new_response_status);
		c.write(new_response_status + '\n\n' + new_response_body + '\n');
	});
	
});

server.listen(ctp_server_port, function() {
	var currentTime = new Date();
	console.log('CTP-SSL server bound and ready, '+currentTime.toString());
});
