/**
 * CTP server
 */

// import standard libs
const tls = require('tls');
const fs = require('fs');
const path = require('path');

// set up some CTP server stuff
const ctp_server_port = 21337;
const ctp_file_root = '../ctproot'; // the local file path that represents the file root
const index_path = '/lol'; // the default file to look up for root requests
const ctp_server_type = 'CyleNet Basic Server'; // lol

// set up TLS server options
const server_options = {
    key: fs.readFileSync('../cylenet.key.pem'),
    cert: fs.readFileSync('../cylenet.crt.pem'),
};

// set up our CTP server on a TLS socket
var server = tls.createServer(server_options, function(c) {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' client connected');
    console.log(currentTime.toString() + ' connection is' + (c.authorized ? 'authorized' : 'unauthorized'));

    // set the proper encoding
    c.setEncoding('utf8');

    // on client socket close
    c.on('end', function() {
        let currentTime = new Date();
        console.log(currentTime.toString() + ' client disconnected');
    });

    // on incoming client request data
    c.on('data', function(data) {
        let currentTime = new Date();
        let new_response_status = '';
        let new_response_body = '';

        // the incoming request string
        let request_string = data.toString().trim();
        console.log(currentTime.toString() + ' new request: ' + request_string);

        // separate request line from headers
        let request_headers = request_string.split("\n");

        // get the request line itself
        let ctp_request = request_headers[0];
        request_headers.splice(0, 1); // reset headers to not include it

        console.log(currentTime.toString() + ' request headers: ', request_headers.join(', '));

        // clear out and compress excess white space
        ctp_request = ctp_request.replace(/ {2,}/g, ' ');
        console.log(currentTime.toString() + ' cleaned CTP request: ' + ctp_request);

        // break down the request string
        let request_parts = ctp_request.split(' ');
        console.log(currentTime.toString() + ' request pieces: ' + request_parts.join(', '));

        // get CTP request version
        var request_version = request_parts[0].toLowerCase();

        // bail out when protocol doesn't work
        if (request_version !== 'ctp/1.0') {
            console.log(currentTime.toString() + ' unsupported protocol');
            c.write('ctp/1.0 nope');
            c.end();
            return;
        }

        // get the incoming method type
        let ctp_method = request_parts[1].toLowerCase();

        // get the incoming host and path piece, parse em
        let ctp_path = request_parts[2];
        ctp_path = path.normalize(ctp_path);
        let ctp_path_parts = /^([-_a-z0-9\.]+)\//i.exec(ctp_path);
        console.log(currentTime.toString() + ' request path parts: ' + ctp_path_parts.join(', '));
        let ctp_host = ctp_path_parts[1];
        ctp_path = ctp_path.replace(ctp_host, '');

        // oh cool
        console.log(currentTime.toString() + ' request host: ' + ctp_host);
        console.log(currentTime.toString() + ' request path: ' + ctp_path);

        // bad path string? bail out
        if (ctp_path.charAt(0) !== '/') {
            c.write('ctp/1.0 nope');
            c.end();
            return;
        }

        // set up actual file path
        let file_path = '';
        if (ctp_path === '/') {
            file_path = ctp_file_root + index_path;
        } else {
            file_path = ctp_file_root + ctp_path;
        }

        // do something based on the CTP method
        if (ctp_method === 'hey') {
            // HEY requests just check for a file
            console.log(currentTime.toString() + ' new HEY request for ' + ctp_path);
            if (fs.existsSync(file_path)) {
                new_response_status = 'ctp/1.0 sure';
            } else {
                new_response_status = 'ctp/1.0 nope';
            }
        } else if (ctp_method == 'req') {
            // REQ requests want the actual contents of a file
            console.log(currentTime.toString() + ' new REQ request for ' + ctp_path);
            if (fs.existsSync(file_path)) {
                new_response_status = 'ctp/1.0 okay';
                new_response_body = fs.readFileSync(file_path, { encoding: 'utf8' });
            } else {
                new_response_status = 'ctp/1.0 nope';
            }
        } else if (ctp_method == 'takethis') {
            // TAKETHIS requests are like POST requests, they have data included for parsing
            console.log(currentTime.toString() + ' new TAKETHIS request for ' + ctp_path);

            // not supported yet

            new_response_status = 'ctp/1.0 nope';
            new_response_body = 'TAKETHIS method not supported yet.'
        } else {
            // welp. dunno what to do.
            console.log(currentTime.toString() + ' error: no CTP method/verb given');
            new_response_status = 'ctp/1.0 nope';
        }

        // send back the response
        currentTime = new Date();
        console.log(currentTime.toString() + ' new response: ' + new_response_status);
        c.write(new_response_status + '\n' + 'server-type: ' + ctp_server_type + '\n\n' + new_response_body + '\n');
        c.end();
    });

});

server.listen(ctp_server_port, function() {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' CTP-SSL server bound and ready');
});
