/**
 * A sample command line WiNS+CTP client
 *
 * Usage:
 * node client.js something.lol/resource
 *
 * or:
 * node client.js 127.0.0.1/resource
 *
 * If you use an IP address, this skips the WiNS lookup.
 */

// get IP of server from given hostname
const wins = require('../WiNS-SSL');

// load the CTP module
const ctp = require('./module.js');

// what WiNS server to use for lookups
const wins_ip = '127.0.0.1';

// this'll hold our full outgoing request
var request = '';

if (process.argv[2] === undefined) {
    console.log('no host given');
    process.exit(1);
} else {
    request = process.argv[2].trim();
}

console.log('request is for: ' + request);

var request_path;
var request_host;
var request_is_ip_already = false;

const ip_regex = /^\d+\.\d+\.\d+\.\d+$/i;

var slash_in_request = request.indexOf('/');
if (slash_in_request === -1) {
    // no slash in the request
    request_path = '/'; // default
    request_host = request;
} else {
    request_path = request.substring(slash_in_request);
    request_host = request.substring(0, slash_in_request);
}

// check to see if we already have the IP address and don't need to do a WiNS lookup
if (ip_regex.test(request_host)) {
    request_is_ip_already = true;
}

console.log('request host: ' + request_host);
console.log('request path: ' + request_path);

if (request_is_ip_already) {
    console.log('request is an IP already, no WiNS lookup necessary');

    // do the CTP request then
    ctp.req(request_host, request_path, request_host, function(page) {
        console.log(page); // got it!
    });
} else {
    console.log('request requires a WiNS lookup first');
    wins.getRecord(request_host, function(wins_response) {
        // do some basic cleanup of the WiNS response
        wins_response = wins_response.replace(/ {2,}/g, ' ');

        // break up the response into parts
        let wins_parts = wins_response.split(' ');

        if (wins_parts.length === 0) {
            console.log('cannot look up hostname, something wrong with the WiNS response: ' + wins_response);
            return;
        }

        // analyze the WiNS lookup response
        if (wins_parts[0] === 'nope') {
            // WiNS lookup failed
            console.log('hostname not found');
        } else if (wins_parts[0] === 'here' && wins_parts.length === 2) {
            // we got it!
            let ctp_ip = wins_parts[1];
            console.log('IP for hostname ' + request_host + ' is ' + ctp_ip);

            // do the CTP request now
            ctp.req(ctp_ip, request_path, request_host, function(page) {
                console.log(page); // got it!
            });
        } else if (wins_parts[0] === 'try' && wins_parts.length === 2) {
            // WiNS lookup points to a different WiNS server
            let wins_forward_ip = wins_parts[1]; // where to look
            console.log('hostname is maybe lookup-able on ' + wins_forward_ip + ', but this client is not set up to hop there');
        } else {
            // dunno what the WiNS lookup gave us
            console.log('cannot look up hostname, WiNS response is weird: ' + wins_response);
        }
    }, wins_ip);
}
