const EventEmitter = require('events');

const conf = require('./config.json');

class Room extends EventEmitter {
    constructor(id) {
        super();

        this.id = id;
        this.levelIndex = 0;
        this.players = [];
        this.playing = false;
    }

    canJoin() {
        return this.players.length <= conf.PLAYER_COUNT;
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
        return true
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
        this.players.splice(this.indexOfWS(ws), 1);
        if (!this.playing) {
            this.sendRoomUpdate();
        }

        ws.removeAllListeners('message');
    }

    onStartGameRequest(ws, msg) {
        if (this.players.length < conf.PLAYER_COUNT) {
            ws.send(JSON.stringify({
                type: 'lobbyError',
                content: 'Not enought players'
            }));
        } else if (this.playing) {
            ws.send(JSON.stringify({
                type: 'lobbyError',
                content: 'Already playing'
            }));
        } else {
            let msgStr = JSON.stringify({
                type: 'startGame',
                levelIndex: this.levelIndex
            });

            this.playing = true;
            for (let player of this.players) {
                player.exitReady = false;
                player.ws.send(msgStr);
            }
        }
    }

    onExitReadyChange(ws, msg) {
        this.players[this.indexOfWS(ws)].exitReady = msg.ready;
        if (this.allExitReady()) {
            this.playing = false;
            this.sendRoomUpdate();
        }
    }

    onLevelSelect(ws, msg) {
        this.levelIndex = msg.levelIndex;
        this.sendRoomUpdate();
    }

    sendRoomUpdate() {
        let msg = {
            type: 'roomUpdate',
            roomId: this.id,
            players: [],
            levelIndex: this.levelIndex
        };

        for (let player of this.players) {
            msg.players.push(player.username);
        }
        this.sendAll(msg);
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
                throw new Error({
                    type: 'invalid message',
                    sender: ws,
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
