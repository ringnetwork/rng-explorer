/*jslint node: true */
"use strict";
require('./start');
var conf = require('rng-core/config/conf.js');
var eventBus = require('rng-core/base/event_bus.js');
var round = require('rng-core/pow/round.js');
var db = require('rng-core/db/db.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var ws = require('./controllers/ws');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/views/index.html');
});

app.get('/detail', function(req, res) {
	res.sendFile(__dirname + '/views/detail.html');
});

app.get('/addressMap', function(req, res) {
	res.sendFile(__dirname + '/views/addressMap.html');
});

eventBus.on('new_joint', function() {
	io.sockets.emit('update');
});

// eventBus.on('round_switch', function (round_index) {
// 	// tell main page to update coinbase info
// 	var minedTotalCoinbase = round.getSumCoinbaseByEndRoundIndex(round_index - 1);
// 	round.getDifficultydByRoundIndex(db, round_index, function (difficultyOfRound){
// 		io.sockets.emit('coinbase_mined', {issuedCoinbase: minedTotalCoinbase, difficulty:difficultyOfRound, round_index: round_index});
// 		console.log('=== Round Switch === : '+round_index);
// 	});
// });

io.on('connection', function(socket) {
	socket.on('staticdata', ws.staticdata);
	socket.on('getRoundStatus', ws.getRoundStatus);
	socket.on('getOnLinePeers', ws.getOnlinePeers);
	socket.on('getDurationTime', ws.getDurationTime);
	socket.on('start', ws.start);
	socket.on('next', ws.next);
	socket.on('prev', ws.prev);
	socket.on('new', ws.newUnits);
	socket.on('info', ws.info);
	socket.on('highlightNode', ws.highlightNode);
	socket.on('nextPageTransactions', ws.nextPageTransactions);
});

io.of('detail').on('connection', function(socket) {
	socket.on('start', ws.start);
	socket.on('next', ws.next);
	socket.on('prev', ws.prev);
	socket.on('new', ws.newUnits);
	socket.on('info', ws.info);
	socket.on('highlightNode', ws.highlightNode);
	socket.on('nextPageTransactions', ws.nextPageTransactions);
});
server.listen(conf.webPort);
