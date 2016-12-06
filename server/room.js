const EventEmitter = require('events');

const conf = require('./config.json');

class Room extends EventEmitter {
    constructor(id) {
        super();

        this.id = id;
        this.players = [];
    }

    canJoin() {
        return this.players.length <= conf.PLAYER_COUNT;
    }

    broadcast(ws, receivedMsg) {
        let msg = receivedMsg;
        msg.playerId = ws.id;

        let msgStr = JSON.stringify(msg);

        for (let player of this.players) {
            if (player.ws !== ws) {
                player.ws.send(msgStr);
            }
        }
    }

    disconnect(ws) {
        this.players.splice(ws.id, 1);
        for (let i = 0;i < this.players.length;i++) {
            this.players[i].id = i;
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

        for (let player of this.players) {
            player.ws.send(msgStr);
        }
    }

    addPlayer(ws, msg) {
        const room = this;

        ws.id = this.players.length;

        ws.on('message', msgStr => {
            let msg = JSON.parse(msgStr);

            if (msg.type === 'broadcast') {
                room.broadcast(ws, msg.body);
            } else if (msg.type == 'start') {

            } else {
                throw new Error({
                    type: 'invalid message',
                    sender: ws,
                    body: msg
                });
            }
        });

        ws.on('close', () => {
            room.disconnect(ws);
        });

        this.players.push({
            ws: ws,
            username: msg.username || ''
        });

        this.sendRoomUpdate();
    }
};

module.exports = Room
