const EventEmitter = require('events');

const conf = require('./config.json');

class Room extends EventEmitter {
    constructor(id) {
        super();

        this.id = id;
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
        console.log('not found');
        return null;
    }

    broadcast(ws, receivedMsg) {
        let msg = receivedMsg;
        msg.playerId = this.indexOfWS(ws);

        let msgStr = JSON.stringify(msg);
        //console.log('broadcast', msgStr);

        for (let player of this.players) {
            if (player.ws !== ws) {
                //console.log('Sending broadcast');
                player.ws.send(msgStr);
            }
        }
    }

    leaveRoom(ws) {
        console.log(this.players);
        console.log(this.indexOfWS(ws));
        this.players.splice(this.indexOfWS(ws), 1);
        console.log(this.players);
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
            let msgStr = JSON.stringify({type: 'startGame'});
            for (let player of this.players) {
                player.ws.send(msgStr);
            }
        }
    }

    sendRoomUpdate() {
        let msg = {
            type: 'roomUpdate',
            roomId: this.id,
            players: []
        };

        for (let player of this.players) {
            msg.players.push(player.username);
        }

        let msgStr = JSON.stringify(msg);
        //console.log(msgStr);

        for (let player of this.players) {
            player.ws.send(msgStr);
        }
    }

    addPlayer(ws, msg) {
        //console.log('addingPlayer)');

        ws.on('message', msgStr => {
            let msg = JSON.parse(msgStr);

            if (msg.type === 'broadcast') {
                this.broadcast(ws, msg.body);
            } else if (msg.type == 'startGame') {
                this.onStartGameRequest(ws, msg);
            } else if (msg.type == 'leaveRoom') {
                this.leaveRoom(ws);
                this.emit('playerLeave', ws);
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
            username: msg.username || ''
        });

        console.log('sending player update');
        this.sendRoomUpdate();
    }
};

module.exports = Room
