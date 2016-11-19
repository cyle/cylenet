const tls = require('tls');
const fs = require('fs');

if (!String.prototype.trim) {
    String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

const wins_server_port = 21335;
var wins_addresses = {};

const winners_file_contents = fs.readFileSync('winners', { encoding: 'UTF-8' });
console.log(winners_file_contents);

const winners_entries = winners_file_contents.split("\n");
for (let i in winners_entries) {
    if (winners_entries[i].trim() === '') {
        continue;
    }

    let pieces = winners_entries[i].trim().split(' ');

    if (pieces.length < 2) {
        continue;
    }

    let wins_domain = pieces[0].trim();

    if (wins_addresses[wins_domain] !== undefined) {
        continue;
    }

    let wins_verb = pieces[1].trim().toLowerCase();

    if (pieces.length === 2) {
        if (wins_verb === 'nope') {
            wins_addresses[wins_domain] = {
                type: 'nope',
            };
        }
    } else if (pieces.length === 3) {
        let wins_ip = pieces[2].trim();
        if (wins_verb === 'here') {
            wins_addresses[wins_domain] = {
                type: 'here',
                ip: wins_ip,
            };
        } else if (wins_verb === 'try') {
            wins_addresses[wins_domain] = {
                type: 'try',
                ip: wins_ip,
            };
        }
    }
}

// console.log(wins_addresses);

const server_options = {
    key: fs.readFileSync('../cylenet.key.pem'),
    cert: fs.readFileSync('../cylenet.crt.pem'),
};

const server = tls.createServer(server_options, function(c) {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' client connected');
    console.log(currentTime.toString() + ' connection is ', c.authorized ? 'authorized' : 'unauthorized');

    c.setEncoding('utf8');

    c.on('end', function() {
        let currentTime = new Date();
        console.log(currentTime.toString() + ' client disconnected');
    });

    c.on('data', function(data) {
        let currentTime = new Date();
        let request_string = data.toString().trim();
        let new_response = '';

        console.log(currentTime.toString() + ' new request: ' + request_string);

        let address = wins_addresses[request_string];
        if (address !== undefined) {
            if (address.type === undefined) {
                // what the fuck ... ?
                new_response = 'nope'; // fallback
            } else if (address.type !== undefined && address.ip !== undefined) {
                new_response = address.type + ' ' + address.ip;
            } else {
                new_response = address.type;
            }
        } else {
            new_response = 'nope';
        }

        currentTime = new Date();
        console.log(currentTime.toString() + ' new response: ' + new_response);
        c.write(new_response + '\n');
        c.end();
    });

});

server.listen(wins_server_port, function() {
    let currentTime = new Date();
    console.log(currentTime.toString() + ' WiNS-SSL server bound and ready at port ' + wins_server_port);
});
