#!/usr/bin/env node

var ws = require('ws');
var util = require('util');

var server = new ws.Server({ port: 8080 });

server.on('connection', function(ws) {
    console.log('connection');

    ws.on('message', function(data, flags) {
        console.log('received: ' + util.inspect(data));

        ws.send(data, { binary: flags.binary });
    });

    ws.on('close', function() {
        console.log('close');
    });
});