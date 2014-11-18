var tls = require('tls');
var markdown = require('markdown').markdown;
var wins = require('../WiNS-SSL');

var ctp_default_server_port = 21337;

var render_md_as_html = false;

function id(wat) {
	return document.getElementById(wat);
}

if (!String.prototype.trim) {
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

function init() {
	console.log('init running');
	id('md-as-html').addEventListener('click', render_toggle, false);
	id('address-bar').addEventListener('keyup', address_typing, false);
	console.log('init\'d');
}

function render_toggle() {
	if (render_md_as_html) {
		render_md_as_html = false;
		id('md-as-html').className = "off";
	} else {
		render_md_as_html = true;
		id('md-as-html').className = "on";
	}
}

function address_typing(e) {
	if (e.keyCode == 13) { // ENTER key
		go();
	}
}

function go() {
	var crl = id('address-bar').value;
	crl = crl.trim();
	
	if (crl == '') {
		//alert('Please enter a location in the address bar.');
		return;
	}
	
	//alert(crl);
	console.log('traveling to: ' + crl);
	
	// get the host name from the address
	var crl_matches = /^(ctp:\/\/)?([-_\.a-z0-9]+)\/?([-_\.\/a-z0-9]+)?$/i.exec(crl);
	console.log(crl_matches);
	
	if (crl_matches[2] == undefined) {
		id('content').innerHTML = '<pre>No valid host name provided, please try again.</pre>';
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
	request_string += "\n" + 'Client-type: CyleNet Browser 1.0';
	
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
				console.log('got back raw: ' + data);
				var ctp_response = data.substring(0, data.indexOf("\n\n"));
				console.log('CTP response: ' + ctp_response);
				var ctp_headers = ctp_response.split("\n");
				var ctp_response_line = ctp_headers[0];
				ctp_headers.splice(0, 1);
				console.log(ctp_headers);
				var ctp_response_body = data.substring(data.indexOf("\n\n") + 2);
				var html = '';
				if (render_md_as_html) {
					html = markdown.toHTML(ctp_response_body);
				} else {
					html = '<pre>'+ctp_response_body+'</pre>';
				}
				console.log('the html to display: ' + html);
				id('content').innerHTML = html;
			});
			
			cleartextStream.on('end', function() {
				console.log('client disconnected');
			});
			
		} else if (wins_parts[0] == 'nope') {
			console.log('hostname not found');
			id('content').innerHTML = '<pre>Hostname not found.</pre>';
		} else {
			console.log('cannot look up hostname');
			id('content').innerHTML = '<pre>Unknown error: cannot look up hostname.</pre>';
		}
		
	});
	
}

window.addEventListener("load", init, false);