# cylenet

## What...?

cylenet is an experiment, in which I build my own internet-like thing. It (currently) has two primary features:

- **WiNS**, AKA Winners Name Service, a DNS-like service that expects hostnames and responds with IP addresses.
- **CTP**, AKA Cyle's Transfer Protocol, an HTTP-like service that expects requests for files and responds with the contents of those files.

Both are meant to be top-to-bottom SSL-encrypted.

## Why...?

Because why not.

## Requirements

- node.js 0.10 or later (at least, that's what I built it with)

## How do I use this?

Right now it's all very, very simple. It's currently configured to work on _your own computer only_ (all localhost pretty much). And these instructions are written assuming you're on a Mac.

First of all, clone this repository somewhere on your computer.

Open three Terminal windows. Using one of them, you need to make some self-signed SSL certificates:

1. `cd` into the `cylenet` folder you cloned.
1. Run `openssl genrsa -out cylenet.key.pem 2048`
1. Next, run `openssl req -new -key cylenet.key.pem -out cylenet.csr.pem`
1. Next, run `openssl x509 -req -in cylenet.csr.pem -signkey cylenet.key.pem -out cylenet.crt.pem`

Yes, you just made a self-signed certificate, which isn't great for "verified" authorized encrypted traffic, but for now it'll have to do until I come with a cylenet SSL alternative.

Now that you have your cert set up, here's what you do with the project to test this out and see it work:

1. in one Terminal window, go to the `WiNS-SSL` folder, and run `node server.js`
1. in another Terminal window, go to the `CTP-SSL` folder, and run `node server.js`
1. in the final Terminal window, go to the `CTP-SSL` folder, and run `node client.js "cyle.lol"`

That final step does the following...

1. uses my WiNS-SSL module to translate the desired server hostname "cyle.lol" to the IP "127.0.0.1"
1. sends the request `req cyle.lol/` to the CTP server at that IP.
1. renders out the response, which should be a simple text file, in Markdown format, from the "ctproot" folder.

## Technical crap

- WiNS-SSL runs on port 21335 by default
- CTP-SSL runs on port 21337 by default
- all of this is still TCP-based... not sure how I feel about that part yet, if I want to dive deeper
- "real" TLS certificates still rely on old ideas, kind of, which I don't want, so I may accept the reality of self-signed certs
- WiNS and CTP are standard specifications much like DNS and HTTP, and I've started documenting them in the `docs` folder.
- `ctproot` is the folder the CTP server uses as a base for requests. A "lol" file is the default "index" file equivalent.

## To-do list

- [ ] Update WiNS-SSL to use the text file format described in the spec
- [ ] Update WiNS-SSL to send back `try` responses
- [ ] Add in some kind of memcache-based rate limiting to CTP and WiNS ?
- [ ] Update the GUI browser, add some kind of way to manage what WiNS servers you trust
- [ ] Make the GUI browser run a WiNS server ?
- [ ] Add some kind of wildcard functionality to WiNS records? as in `* try 192.168.1.1` as a fallback at the end of a file?
- [ ] Add some kind of client-side caching of WiNS records? if so, add a TTL to the server and client...?
- [ ] Need to compress CTP traffic with gzip or something
