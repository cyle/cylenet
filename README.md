# CyleNet

## What...?

CyleNet is an experiment, in which I build my own internet-like thing. It (currently) has two primary features:

- **WiNS**, AKA Winners Name Service, a DNS-like service that expects hostnames and responds with IP addresses.
- **CTP**, AKA Cyle's Transfer Protocol, an HTTP-like service that expects requests for files and responds with the contents of those files.

Both are meant to be top-to-bottom SSL-encrypted.

## Why...?

Because why not.

## Requirements

- node.js 0.10 or later (at least, that's what I built it with)

## How do I use this?

Right now it's all very, very simple. It's currently configured to work on your own computer only. On a Mac, open three Terminal windows.

First, using one of them, you need to make some SSL certificates:

1. in Terminal, go to the "cylenet" folder
1. in Terminal, run `openssl genrsa -out cylenet.key.pem 2048`
1. in Terminal, run `openssl req -new -key cylenet.key.pem -out cylenet.csr.pem`
1. in Terminal, run `openssl x509 -req -in cylenet.csr.pem -signkey cylenet.key.pem -out cylenet.crt.pem`

Yes, you just made a self-signed certificate, which isn't great for real authorized encrypted traffic, but for now it'll have to do until I come with a CyleNet SSL alternative.

Now that you have a cert, here's what you do with the project to test this out:

1. in one Terminal window, go to the "WiNS-SSL" folder, and run `node server.js`
1. in another Terminal window, go to the "CTP-SSL" folder, and run `node server.js`
1. in the final Terminal window, go to the "CTP-SSL" folder, and run `node client.js "cyle.lol"`

That final step does the following...

1. uses my WiNS-SSL module to translate the desired server hostname "cyle.lol" to the IP "127.0.0.1"
1. sends the request "REQ cyle.lol/" to the CTP server at that IP.
1. renders out the response, which should be a simple text file, in Markdown format, from the "ctproot" folder.

## Technical crap

- WiNS-SSL runs on port 21335
- CTP-SSL runs on port 21337
- all of this is still TCP-based
- the SSL certificate crap still relies on DNS, kind of, which I don't want, so i may accept the reality of self-signed certs
- WiNS and CTP are standard specifications much like DNS and HTTP, and I've started documenting them in the `docs` folder.
- "ctproot" is the folder the CTP server uses as a base for requests. A "lol" file is the default "index" file equivalent.

## Ideas

- Not sure whether I'd like to somehow decentralize WiNS or make it a web-of-trust type deal. leaning towards web-of-trust.
- CyleNet Browser using node-webkit. I like the idea of having only text-based files served, and have them in Markdown format, which can be parsed and then presented in a standardized fashion. When I first thought of CyleNet, I thought of a network protocol that was *only* for text. But good-looking text. "basic"/default view is just markdown documents in plain text, i.e. iA writer, where as "rendered" view actually renders the markdown into HTML with a user-chosen stylesheet? browser first must attach to a "web of trust" network which provides WiNS server addresses, maybe?
- Need to compress CTP traffic with GZIP or something.

## To-do list

- [ ] Update WiNS-SSL to use the text file format described in the spec
- [ ] Update WiNS-SSL to send back `try` responses
- [ ] Add in some kind of memcache-based rate limiting to CTP and WiNS ?
- [ ] Update the GUI browser, add some kind of way to manage what WiNS servers you trust
- [ ] Make the GUI browser run a WiNS server ?
- [ ] Add some kind of wildcard functionality to WiNS records? as in `* try 192.168.1.1` as a fallback at the end of a file?
- [ ] Add some kind of client-side caching of WiNS records? if so, add a TTL to the server and client...?
