'use strict';
const EventEmitter = require('events');

const conf = require('./config.json');

class Room extends EventEmitter {
    constructor(id) {
        super();

        this.id = id;
        this.levelIndex = null;
        this.players = [];
        this.playing = false;
    }

    canJoin() {
        return this.players.length < conf.PLAYER_COUNT;
    }

    indexOfWS(ws) {
        for (let i = 0;i < this.players.length;i++) {
            if (this.players[i].ws === ws) {
                return i;
            }
        }
        return null;
    }

    allExitReady() {
        for (let player of this.players) {
            if (!player.exitReady) {
                return false;
            }
        }
        return true;
    }

    broadcast(ws, receivedMsg) {
        let msg = receivedMsg;
        msg.playerId = this.indexOfWS(ws);

        let msgStr = JSON.stringify(msg);

        for (let player of this.players) {
            if (player.ws !== ws) {
                player.ws.send(msgStr);
            }
        }
    }
    sendAll(msg) {
        let msgStr = JSON.stringify(msg);
        for (let player of this.players) {
            player.ws.send(msgStr);
        }
    }

    leaveRoom(ws) {
        ws.removeAllListeners('message');
        this.players.splice(this.indexOfWS(ws), 1);

        if (this.players.length == 0) {
            this.emit('empty', this.id);
        } else if (this.playing) {
            this.playing = false;

            let roomData = this.generateRoomUpdate();
            roomData.error = 'A player disconnected';

            this.sendAll({
                type: 'levelEnd',
                passed: false,
                roomUpdate: roomData
            });
        } else {
            this.sendRoomUpdate();
        }

    }

    onStartGameRequest(ws, msg) {
        if (this.players.length < conf.PLAYER_COUNT) {
            ws.send(JSON.stringify({
                type: 'lobbyError',
                content: 'Not enought players'
            }));
        } else if (this.levelIndex === null) {
            ws.send(JSON.stringify({
                type: 'lobbyError',
                content: 'Select a level'
            }));
        } else if (this.playing) {
            ws.send(JSON.stringify({
                type: 'lobbyError',
                content: 'Already playing'
            }));
        } else {
            this.playing = true;

            for (let i = 0;i < this.players.length;i++) {
                this.players[i].exitReady = false;
                this.players[i].ws.send(JSON.stringify({
                    type: 'startGame',
                    levelIndex: this.levelIndex,
                    playerIndex: i
                }));
            }
        }
    }

    onExitReadyChange(ws, msg) {
        this.players[this.indexOfWS(ws)].exitReady = msg.ready;
        if (this.allExitReady()) {
            this.playing = false;

            this.sendAll({
                type: 'levelEnd',
                passed: true,
                roomUpdate: this.generateRoomUpdate()
            });
        }
    }

    onLevelSelect(ws, msg) {
        this.levelIndex = msg.levelIndex;
        this.sendRoomUpdate();
    }

    generateRoomUpdate() {
        let msg = {
            type: 'roomUpdate',
            roomId: this.id,
            players: [],
            levelIndex: this.levelIndex
        };

        for (let player of this.players) {
            msg.players.push(player.username);
        }
        return msg;
    }
    sendRoomUpdate() {
        this.sendAll(this.generateRoomUpdate());
    }

    addPlayer(ws, msg) {

        ws.on('message', msgStr => {
            let msg = JSON.parse(msgStr);

            if (msg.type === 'broadcast') {
                this.broadcast(ws, msg.body);
            } else if (msg.type == 'startGame') {
                this.onStartGameRequest(ws, msg);
            } else if (msg.type == 'leaveRoom') {
                this.leaveRoom(ws);
                this.emit('playerLeave', ws);
            } else if (msg.type == 'exitReady') {
                this.onExitReadyChange(ws, msg);
            } else if (msg.type == 'levelSelect') {
                this.onLevelSelect(ws, msg);
            } else {
                console.warn({
                    type: 'invalid message',
                    body: msg
                });
            }
        });

        ws.on('close', () => {
            this.leaveRoom(ws);
        });

        this.players.push({
            ws: ws,
            username: msg.username || '',
            exitReady: false
        });

        this.sendRoomUpdate();
    }
};

module.exports = Room
