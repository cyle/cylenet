/**
 *
 * CyleNet Browser, lol
 *
 */

// load up external deps
const electron = require('electron');
const ipcMain = electron.ipcMain;
const path = require('path');
const url = require('url');
const markdown = require('markdown').markdown;

// require our helper modules for using the WiNS and CTP protocols
const wins = require('../WiNS-SSL/');
const ctp = require('../CTP-SSL/');

// Module to control application life.
const app = electron.app;

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window objects, if you don't, the windows will
// be closed automatically when the JavaScript object is garbage collected.
let winsWindow;
let mainWindow;

// the current URL we're at
global.current_url = '';

// our main app's cache of WiNS servers to use
let wins_cache = [];

/**
 * Helper function which creates the app's windows and sets up the start of everything.
 */
function createWindows() {
    console.log('creating windows');

    // create the WiNS config management window
    winsWindow = new BrowserWindow({
        width: 200,
        height: 400,
        x: 10,
        y: 10,
        minWidth: 200,
        minHeight: 300,
    });

    // load up the WiNS config page
    winsWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'wins_config.html'),
        protocol: 'file:',
        slashes: true,
    }));

    // when the page is done loading, fetch what's in the WiNS list to start
    winsWindow.webContents.on('did-finish-load', () => {
        winsWindow.webContents.send('get-wins-list');
    });

    // create the browser window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 400,
    });

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
    }));

    // on window close
    winsWindow.on('closed', function() {
        winsWindow = null;
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindows);

// quit when all windows are closed
app.on('window-all-closed', function() {
    // if we're on a mac, don't quit when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

// on app activate, as in the dock icon was clicked or something
app.on('activate', function () {
    if (mainWindow === null && winsWindow === null) {
        createWindows();
    }
})

// when we're given an updated WiNS server list, update our cache
ipcMain.on('update-wins-list', (event, list) => {
    console.log('updating cached wins list with: ', list);
    wins_cache = list;
});

// when we're told to browse somewhere, try to!
ipcMain.on('browse', (event, url) => {
    console.log('NEW BROWSE EVENT');
    console.log('gonna try to fetch ' + url);

    if (mainWindow === null) {
        return;
    }

    getResource(url);
});

/**
 * Helper function to get a resource at the given URL.
 * Does the hard work of using the WiNS and CTP protocols.
 * @param {String} url The url to access.
 */
function getResource(url) {
    console.log('gonna use WiNS servers:');
    console.log(wins_cache);
    global.current_url = url;

    let request_path;
    let request_host;
    let request_is_ip_already = false;

    const ip_regex = /^\d+\.\d+\.\d+\.\d+$/i;

    let slash_in_request = url.indexOf('/');
    if (slash_in_request === -1) {
        // no slash in the request
        request_path = '/'; // default
        request_host = url;
    } else {
        request_path = url.substring(slash_in_request);
        request_host = url.substring(0, slash_in_request);
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
            // console.log(page); // got it!
            parseResponse(page);
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
                    // console.log(page); // got it!
                    parseResponse(page);
                });
            } else if (wins_parts[0] === 'try' && wins_parts.length === 2) {
                // WiNS lookup points to a different WiNS server
                let wins_forward_ip = wins_parts[1]; // where to look
                console.log('hostname is maybe lookup-able on ' + wins_forward_ip + ', but this client is not set up to hop there');
            } else {
                // dunno what the WiNS lookup gave us
                console.log('cannot look up hostname, WiNS response is weird: ' + wins_response);
            }
        }, wins_cache[0]); // need to go down the list if the first one fails
    }
}

/**
 * Given a response string raw from a CTP server, parse it and show the result.
 *
 * @param {String} response The raw full CTP response to parse.
 */
function parseResponse(response) {
    console.log('got response:');
    console.log(response);

    // figure out if there's a breakpoint between the headers and the content body
    let response_breakpoint = response.indexOf('\n\n');
    let response_headers;

    // if there is no breakpoint, then we only parse headers
    if (response_breakpoint === -1) {
        response_headers = response.trim().split('\n');
        response_breakpoint = response.length - 1;
    } else {
        // if there was a breakpoint, separate the headers from the content body
        response_headers = response.substring(0, response_breakpoint).trim().split('\n');
    }

    // pull out the CTP status line
    let response_status = response_headers[0];
    response_headers = response_headers.slice(1); // get rid of that top line
    let response_status_pieces = response_status.split(' ');

    // what values these get depends on how things go
    let page_content_raw = '';
    let page_content_final = '';

    // get the CTP server version and parse
    let server_ctp_version = response_status_pieces[0].trim().toLowerCase();
    if (server_ctp_version === 'ctp/1.0') {
        // cool, now we expect the rest to be in a certain format
        let response_status_code = response_status_pieces[1].trim().toLowerCase();
        console.log('response status code: ' + response_status_code);

        // parse through the response headers and make a friendly object with keys and values
        let response_headers_final = {};
        for (var i in response_headers) {
            let response_header_breakpoint = response_headers[i].indexOf(' ');
            let response_header_key = response_headers[i].substring(0, response_header_breakpoint).trim().toLowerCase();
            let response_header_value = response_headers[i].substring(response_header_breakpoint).trim();
            response_headers_final[response_header_key] = response_header_value;
        }
        console.log('response headers: ', response_headers_final);

        // show different results based on the response status code given
        if (response_status_code === 'okay') {
            // cool, resource was found and we got content back
            page_content_raw = response.substring(response_breakpoint).trim();

            // change display content based on what we were given
            if (page_content_raw === '') {
                // oops... nothing here? blank file?
                page_content_final = '<p class="ctp-error">The server response contained no content.</p>';
            } else if (response_headers_final['data-type'] !== undefined && response_headers_final['data-type'] === 'plaintext') {
                // plain text file
                page_content_final = '<pre>' + page_content_raw + '</pre>';
            } else {
                // default is to try parsing as markdown
                page_content_final = markdown.toHTML(page_content_raw);
            }
        } else if (response_status_code === 'nope') {
            // resource doesn't exist, or otherwise something went wrong
            page_content_final = '<p class="ctp-error">Resource not found, or not available, or something went wrong.</p>';
        } else {
            // uhhhhh not sure what to do here if this happens
            page_content_final = '<p class="ctp-error">The server responded with an unsupported CTP status code.</p>';
        }
    } else {
        // server either wasn't a CTP server or responded with something we don't understand
        page_content_final = '<p class="ctp-error">The server did not respond with a valid CTP response.</p>';
    }

    // one last check to see if we came up with anything to display in the UI
    if (page_content_final.trim() === '') {
        page_content_final = '<p class="ctp-error">The server responded with something weird.</p>';
    }

    // give the UI the contents to display to the user
    mainWindow.webContents.send('show', page_content_final);
}
