#!/usr/bin/env node

var ws = require('ws');

var server = new ws.Server({ port: 8080 });

server.on('connection', function(ws) {
    console.log('connection');

    ws.watchers = {};

    ws.on('message', function(data) {
        console.log('received: ' + data);

        handleMessage(ws, data);
    });

    ws.on('close', function() {
        for (var symbol in ws.watchers) {
            ws.watchers[symbol].stop();
            delete ws.watchers[symbol];
        }
        console.log('close');
    });
});

function handleMessage(ws, message) {
    if (message.indexOf('WATCH:') === 0) {
        var symbol = getSymbol(message);
        ws.send('WATCHING:' + symbol);
        var watcher = ws.watchers[symbol];
        if (!watcher) {
            ws.watchers[symbol] = new Watcher(ws, symbol);
        }
    } else if (message.indexOf('STOP:') === 0) {
        var symbol = getSymbol(message);
        var watcher = ws.watchers[symbol];
        if (watcher) {
            watcher.stop();
            delete ws.watchers[symbol];
            ws.send('STOPPED:' + symbol);
        }
    } else {
        ws.send('UNKNOWN:' + message);
    }
}

function getSymbol(message) {
    return message.substr(message.indexOf(':') + 1);
}

var symbolRepository = new SymbolRepository();

function Watcher(ws, symbol) {
    var intervalRange = 3000;
    var timerId;

    emit();

    function emit() {
        var price = symbolRepository.getPrice(symbol);
        ws.send(symbol + '=' + price.toFixed(2));
        timerId = setTimeout(emit, Math.random() * intervalRange);
    }

    this.stop = function() {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
    }
}

function SymbolRepository() {
    var initialMean = 50;
    var initialVariance = 25;
    var volatility = 0.05;

    var prices = {};

    this.getPrice = function(symbol) {
        if (!(symbol in prices)) {
            return prices[symbol] = round(boxMuller(initialMean, initialVariance));
        }

        return prices[symbol] = round(nextPrice(prices[symbol], volatility));
    }
 
    function round(val) {
        return Math.round(val * 100) / 100;
    }

    function nextPrice(lastPrice, volatility) {
        return lastPrice * Math.exp(boxMuller(0, volatility));
    }

    function boxMuller(mean, variance) {
        return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random()) * variance + mean;
    }
}