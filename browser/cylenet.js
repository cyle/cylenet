var tls = require('tls');
var markdown = require('markdown').markdown;
var wins = require('../WiNS-SSL');

var ctp_default_server_port = 21337;

function id(wat) {
	return document.getElementById(wat);
}

if (!String.prototype.trim) {
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

function init() {
	console.log('init running');
	id('go-btn').addEventListener('click', go, false);
	console.log('init\'d');
}

function go() {
	var crl = id('address-bar').value;
	//alert(crl);
	console.log('traveling to: ' + crl);
	
	// get the host name from the address
	var crl_matches = /^(ctp:\/\/)?([-_\.a-z0-9]+)\/?([-_\.\/a-z0-9]+)?$/i.exec(crl);
	console.log(crl_matches);
	
	if (crl_matches[2] == undefined) {
		alert('No valid host name provided, please try again.');
		return;
	}
	var request_host = crl_matches[2];
	var request_path = crl_matches[3];
	if (request_path == undefined) {
		request_path = '/';
	} else {
		request_path = '/' + request_path;
	}
	
	console.log('request is: ' + request_host + request_path);
	
	id('address-bar').value = 'ctp://' + request_host + request_path;
	
	var request_string = 'ctp/1.0 req '+request_host + request_path;
	
	wins.getIP(request_host, function(wins_response) {
		// parse first word of WiNS response
		wins_response = wins_response.replace(/ {2,}/g, ' ');
		var wins_parts = wins_response.split(' ');
		
		if (wins_parts[0] == 'here') {
			
			var wins_ip = wins_parts[1];
			
			console.log('IP for hostname ' + request_host + ' is ' + wins_ip);
			
			var options = {
				rejectUnauthorized: false
			};
			
			var cleartextStream = tls.connect(ctp_default_server_port, wins_ip, options, function() {
				console.log('client connected');
				console.log('connection is', cleartextStream.authorized ? 'authorized' : 'unauthorized');
				console.log('sending request: '+request_string);
				cleartextStream.write(request_string+'\n');
			});
			
			cleartextStream.setEncoding('utf8');
			
			cleartextStream.on('data', function(data) {
				data = data.toString();
				console.log('got back: ' + data);
				var html = '';
				if (id('md-as-html').checked) {
					html = markdown.toHTML(data);
				} else {
					html = '<pre>'+data+'</pre>';
				}
				id('lol').src = 'data:text/html;charset=utf-8,' + html;
			});
			
			cleartextStream.on('end', function() {
				console.log('client disconnected');
			});
			
		} else if (wins_parts[0] == 'nope') {
			console.log('hostname not found');
		} else {
			console.log('cannot look up hostname');
		}
		
	});
	
}

window.addEventListener("load", init, false);