class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = new WebSocket(`ws://${document.location.hostname}:7001`);

        //this.onlinePlayers = {};
        this.onKeyframeUpdate = new Phaser.Signal();
        this.onTileUpdate = new Phaser.Signal();
        this.onRoomUpdate = new Phaser.Signal();
        this.onJoinError = new Phaser.Signal();

        this.onGameStart = new Phaser.Signal();

        this.ws.onmessage = msgStr => {
            let msg = JSON.parse(msgStr.data);

            if (msg.type == 'keyframeUpdate') {
                this.onKeyframeUpdate.dispatch(msg);
            } else if (msg.type == 'tileUpdate') {
                this.onTileUpdate.dispatch(msg);
            } else if (msg.type == 'joinError') {
                this.onJoinError.dispatch(msg);
            } else if (msg.type == 'roomUpdate') {
                this.onRoomUpdate.dispatch(msg);
            } else {
                console.log('Received unknown message', msg);
            }
        }
    }

    joinRoom(roomId) {
        this.sendOnOpen({
            type: 'join',
            roomId: roomId,
            username: this.game.global.username
        });
    }

    createRoom() {
        this.sendOnOpen({
            type: 'createRoom',
            username: this.game.global.username
        });
    }

    sendTileUpdate(tile) {
        console.log(tile, tile.id);
        this.send({
            type: 'broadcast',
            body: {
                type: 'tileUpdate',
                x: tile.x,
                y: tile.y,
                layer: tile.layer.name,
                index: tile.index,
                properties: {
                    onUseId: tile.properties.onUseId
                }
            }
        });
    }

    sendKeyframe(player) {
        this.send({
            type: 'broadcast',
            body: {
                type: 'keyframeUpdate',
                x: player.x,
                y: player.y,
                time: this.game.time.now
            }
        });
    }

    sendOnOpen(json) {
        if (this.ws.readyState === WebSocket.OPEN) {
                this.send(json);
        } else {
            this.ws.onopen = () => {
                this.send(json);
            }
        }
    }

    send(json) {
        if (this.ws.readyState !== WebSocket.OPEN) {
            return false;
        } else {
            this.ws.send(JSON.stringify(json));
            return true;
        }
    }
}

module.exports = NetworkManager;
