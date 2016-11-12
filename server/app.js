'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const process = require('process');
const randomstring = require('randomstring');
const url = require('url');
const ws = require('ws');

const conf = require('./config.json');
const Room = require('./room.js');

let app = express();
app.use('/static', express.static(path.join(__dirname, '../build/static')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));


let rooms = {};
app.get('/', function(req, res) {
    let key = randomstring.generate(8);
    res.redirect('/play/' + key);
});
app.get('/play/:room', function(req, res) {
    res.sen
    let roomId = req.params.room;
    let room;

    if ((roomId in rooms) && (!rooms[roomId].canJoin())) {
        res.redirect('/');
    } else {
        console.log(path.join(__dirname, '../build/index.html'));
        res.sendFile(path.join(__dirname, '../build/index.html'));
    }
});

let server = http.createServer();
server.on('request', app);

app.listen(conf.WEB_PORT, function() {
    console.log('Server running on port ', conf.WEB_PORT);
});

let wss = new ws.Server({
    server: server,
    port: conf.WS_PORT
});


wss.on('connection', function(ws) {
    ws.once('message', function initConnect(msgStr) {
        console.log(msgStr);
        let msg = JSON.parse(msgStr);

        if (msg.type != 'connect') {
            ws.close();
        }

        if (!(msg.gameId in rooms)) {
            rooms[msg.gameId] = new Room();
            rooms[msg.gameId].on('gameEnd', () => {
                delete rooms[msg.gameId];
            });
        }

        if (!rooms[msg.gameId].canJoin()) {
            ws.close();
        } else {
            rooms[msg.gameId].addPlayer(ws);
        }
    });
});
