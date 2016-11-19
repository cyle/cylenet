/**
 * CTP client module, for use in other node.js projects.
 * Note: does not include any WiNS functionality.
 */

const tls = require('tls');

// this'll hold our CTP helper functions
const CTP = {};

/**
 * A helper function to do a "hey" CTP request.
 *
 * @param {String} ip The IP address to send the request to.
 * @param {String} path The resource path to request from the server.
 * @param {String} hostname The hostname of the CTP server you're sending a request to.
 * @param {Function} callback The function to call when the request has been completed; should expect a string.
 * @param {Number} ctp_server_port Optional. The CTP server port to access.
 */
CTP.hey = function(ip, path, hostname, callback, ctp_server_port) {
    this.request('hey', ip, path, hostname, undefined, callback, ctp_server_port);
}

/**
 * A helper function to do a "req" CTP request.
 *
 * @param {String} ip The IP address to send the request to.
 * @param {String} path The resource path to request from the server.
 * @param {String} hostname The hostname of the CTP server you're sending a request to.
 * @param {Function} callback The function to call when the request has been completed; should expect a string.
 * @param {Number} ctp_server_port Optional. The CTP server port to access.
 */
CTP.req = function(ip, path, hostname, callback, ctp_server_port) {
    this.request('req', ip, path, hostname, undefined, callback, ctp_server_port);
}

/**
 * A helper function to do a "takethis" CTP request.
 *
 * @param {String} ip The IP address to send the request to.
 * @param {String} path The resource path to request from the server.
 * @param {String} hostname The hostname of the CTP server you're sending a request to.
 * @param {String} data The data to pass along to the server in the request. Must be a string.
 * @param {Function} callback The function to call when the request has been completed; should expect a string.
 * @param {Number} ctp_server_port Optional. The CTP server port to access.
 */
CTP.takethis = function(ip, path, hostname, data, callback, ctp_server_port) {
    this.request('takethis', ip, path, hostname, data, callback, ctp_server_port);
}

/**
 * A helper function to do a totally custom CTP request.
 *
 * @param {String} verb
 * @param {String} ip The IP address to send the request to.
 * @param {String} path The resource path to request from the server.
 * @param {String} hostname The hostname of the CTP server you're sending a request to.
 * @param {String} data The data to pass along to the server in the request. Must be a string.
 * @param {Function} callback The function to call when the request has been completed; should expect a string.
 * @param {Number} ctp_server_port Optional. The CTP server port to access.
 */
CTP.request = function(verb, ip, path, hostname, data, callback, ctp_server_port) {
    // make sure we have a CTP server port to access
    if (ctp_server_port === undefined) {
        ctp_server_port = 21337;
    }

    // make sure a path is specified of some kind
    if (path === undefined) {
        path = '/'; // default to the root
    }

    // our TLS client options
    let tls_client_options = {
        rejectUnauthorized: false
    };

    // set up our TLS stream to the CTP server
    let tls_stream = tls.connect(ctp_server_port, ip, tls_client_options, function() {
        console.log('client connected to CTP server');
        console.log('connection is ' + (tls_stream.authorized ? 'authorized' : 'unauthorized'));

        // build our request string
        let request_string = 'ctp/1.0 ' + verb + ' ' + hostname + path;

        // if we were given data, append it to the request
        if (data !== undefined) {
            request_string += '\n\n' + data;
        }

        // send along the request to the CTP server
        console.log('sending request: ' + request_string);
        tls_stream.write(request_string + '\n');
    });

    // set the expected encoding on the TLS stream
    tls_stream.setEncoding('utf8');

    // when the CTP server gives us back data, hit the callback with it
    tls_stream.on('data', function(data) {
        callback(data.toString().trim());
    });
}

// here you go, enjoy!
module.exports = CTP;
