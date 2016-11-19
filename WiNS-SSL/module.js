/**
 * WiNS client module, for use in other node.js projects.
 */

const tls = require('tls');
const fs = require('fs');
const default_wins_server_port = 21335;

/**
 * A simple helper function that gets a record back for the given hostname from a WiNS server.
 *
 * @param {String} hostname The domain name to look up.
 * @param {Function} callback The callback to perform when this gets the record, should expect a string as input.
 * @param {String} wins_server The WiNS server address to look up on, defaults to localhost
 * @param {Number} wins_server_port The WiNS port to use, defaults to the default 21335
 */
exports.getRecord = function(hostname, callback, wins_server, wins_server_port) {
    // make sure there's a server provided
    if (wins_server === undefined) {
        wins_server = '127.0.0.1'; // default to localhost
    }

    // make sure there's a port defined
    if (wins_server_port === undefined) {
        wins_server_port = default_wins_server_port; // default to the default, lol
    }

    // TLS client options
    let client_options = {
        rejectUnauthorized: false
    };

    // create our TLS stream and send along the given hostname
    let tls_stream = tls.connect(wins_server_port, wins_server, client_options, function() {
        tls_stream.write(hostname.trim() + '\n');
    });

    // set expected encoding back
    tls_stream.setEncoding('utf8');

    // on data back from the server, call the client's callback
    tls_stream.on('data', function(data) {
        callback(data.toString().trim());
    });
};
