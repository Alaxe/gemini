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
    res.redirect('/play/');
});
app.get('/play/', function(req, res) {
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
    return randomstring.generate({
        length: 6,
        charset: 'alphanumeric',
        capitalization: 'lowercase'
    });
}

function initConnection(ws, msgStr) {
    //console.log(msgStr);
    let msg = JSON.parse(msgStr);

    if (msg.type == 'joinRoom') {
        console.log(msg.roomID);
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
        rooms[id].on('playerLeave', (ws) => {
            ws.on('message', msg => {
                initConnection(ws, msg);
            });
        });

        rooms[id].addPlayer(ws, msg);
    }
    //console.log(rooms);
}

wss.on('connection', function(ws) {
    ws.on('message', msg => {
        initConnection(ws, msg);
    });
});
