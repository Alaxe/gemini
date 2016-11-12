const EventEmitter = require('events');

const conf = require('./config.json');

class Room extends EventEmitter {
    constructor() {
        super();

        this.players = [];
    }

    canJoin() {
        return this.players.length <= conf.PLAYER_COUNT;
    }

    broadcast(ws, receivedMsg) {
        let msg = receivedMsg;
        msg.playerId = ws.id;

        if (msg.type === 'tileUpdate') {
            console.log(msg);
        }
        let msgStr = JSON.stringify(msg);

        for (let socket of this.players) {
            if (socket === ws) {
                continue;
            }
            /*setTimeout(() => {
                socket.send(msgStr);
            }, 100);*/

            socket.send(msgStr);
            //console.log('sent');
        }
    }

    disconnect(ws) {
        this.players.splice(ws.id, 1);
        for (let i = 0;i < this.players.length;i++) {
            this.players[i].id = i;
        }
    }

    addPlayer(ws) {
        const room = this;

        ws.id = this.players.length;

        ws.on('message', msgStr => {
            let msg = JSON.parse(msgStr);

            if (msg.type === 'broadcast') {
                room.broadcast(ws, msg.body);
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

        this.players.push(ws);
//        console.log(this.players);
    }
};

module.exports = Room
