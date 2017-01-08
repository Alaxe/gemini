'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const ws = require('ws');
const randomstring = require('randomstring');

const conf = require('./config.json');
const Room = require('./room.js');

let app = express();
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/build', express.static(path.join(__dirname, '../build')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));


app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '../static/index.html'));
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

let rooms = {};

function generateRoomId() {
    let potential = randomstring.generate({
        length: 4,
        charset: 'alphanumeric',
        capitalization: 'lowercase'
    });

    return (potential in rooms)
        ? generateRoomId()
        : potential;
}

function initConnection(ws, msgStr) {
    let msg = JSON.parse(msgStr);

    if (msg.type == 'joinRoom') {
        if (!(msg.roomId in rooms)) {
            ws.send(JSON.stringify({
                type: 'joinError',
                content: 'The specified room doesn\'t exist'
            }));
        } else if (!(rooms[msg.roomId].canJoin())) {
            ws.send(JSON.stringify({
                type: 'joinError',
                content: 'The specified room is full'
            }));
        } else {
            ws.removeAllListeners('message');
            rooms[msg.roomId].addPlayer(ws, msg);
        }
    } else if (msg.type == 'createRoom') {
        ws.removeAllListeners('message');

        let id = generateRoomId();
        rooms[id]= new Room(id);
        rooms[id].on('playerLeave', ws => {
            ws.on('message', msg => {
                initConnection(ws, msg);
            });
        });
        rooms[id].on('empty', id => {
            delete rooms[id];
        });

        rooms[id].addPlayer(ws, msg);
    }
}

wss.on('connection', function(ws) {
    ws.on('message', msg => {
        initConnection(ws, msg);
    });
});
