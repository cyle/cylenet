var tls = require('tls');
var fs = require('fs');
var path = require('path');

if (!String.prototype.trim) {
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

var ctp_server_port = 21337;
var ctp_file_root = '../ctproot';
var index_path = '/lol';

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
		var new_response_status = '';
		var new_response_body = '';
		
		// the incoming request string
		var request_string = data.toString().trim();
		
		console.log(currentTime.toString() + ' new request: ' + request_string);
		
		// separate request line from headers
		var request_headers = request_string.split("\n");
		
		var ctp_request = request_headers[0];
		request_headers.splice(0, 1);
		
		console.log('CTP headers: ');
		console.log(request_headers);
		
		// clear out excess white space
		ctp_request = ctp_request.replace(/ {2,}/g, ' ');
		
		console.log(currentTime.toString() + ' cleaned CTP request: ' + ctp_request);
		
		// break down request string
		var request_parts = ctp_request.split(' ');
		console.log("request pieces: ");
		console.log(request_parts);
		
		// get CTP version
		var request_version = request_parts[0].toLowerCase();
		
		// bail out when protocol doesn't work
		if (request_version != 'ctp/1.0') {
			console.log('unsupported protocol');
			c.write('ctp/1.0 nope');
			return;
		}
		
		// get the incoming method type
		var ctp_method = request_parts[1].toLowerCase();
		
		// get the incoming host and path piece, parse em
		var ctp_path = request_parts[2];
		ctp_path = path.normalize(ctp_path);
		var ctp_path_parts = /^([-_a-z0-9\.]+)\//i.exec(ctp_path);
		console.log("request path parts:");
		console.log(ctp_path_parts);
		var ctp_host = ctp_path_parts[1];
		ctp_path = ctp_path.replace(ctp_host, '');
		
		// oh cool
		console.log("request host: " + ctp_host);
		console.log("request path: " + ctp_path);
		
		// bad path string? bail out
		if (ctp_path.charAt(0) != '/') {
			c.write('ctp/1.0 nope');
			return;
		}
		
		// set up actual file path
		var file_path = '';
		if (ctp_path == '/') {
			file_path = ctp_file_root + index_path;
		} else {
			file_path = ctp_file_root + ctp_path;
		}
		
		// do something based on the CTP method
		if (ctp_method == 'hey') {
			// HEY requests just check for a file
			console.log('new HEY request for ' + ctp_path);
			if (fs.existsSync(file_path)) {
				new_response_status = 'ctp/1.0 sure';
			} else {
				new_response_status = 'ctp/1.0 nope';
			}
		} else if (ctp_method == 'req') {
			// REQ requests want the actual contents of a file
			console.log('new REQ request for ' + ctp_path);
			if (fs.existsSync(file_path)) {
				new_response_status = 'ctp/1.0 okay';
				new_response_body = fs.readFileSync(file_path, {encoding: 'utf8'});
			} else {
				new_response_status = 'ctp/1.0 nope';
			}
		} else if (ctp_method == 'takethis') {
			// TAKETHIS requests are like POST requests, they have data included for parsing
			console.log('new TAKETHIS request for ' + ctp_path);
			
			// not supported yet
			
			new_response_status = 'ctp/1.0 nope';
			new_response_body = 'TAKETHIS method not supported yet.'
		} else {
			// welp. dunno what to do.
			console.log('error: no action given');
			new_response_status = 'ctp/1.0 nope';
		}
		
		// send back the response
		console.log('new response: ' + new_response_status);
		c.write(new_response_status + "\n" + 'Server-type: CyleNet Basic Server' + '\n\n' + new_response_body + '\n');
	});
	
});

server.listen(ctp_server_port, function() {
	var currentTime = new Date();
	console.log('CTP-SSL server bound and ready, '+currentTime.toString());
});
