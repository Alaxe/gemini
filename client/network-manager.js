class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = new WebSocket(`ws://${document.location.hostname}:7001`);

        //this.onlinePlayers = {};
        this.on = {
            diamondPickup: new Phaser.Signal(),
            keyframeUpdate: new Phaser.Signal(),
            tileUpdate: new Phaser.Signal(),
            roomUpdate: new Phaser.Signal(),
            startGame: new Phaser.Signal(),
            joinError: new Phaser.Signal(),
            lobbyError: new Phaser.Signal(),
            levelFinish: new Phaser.Signal()
        };


        this.ws.onmessage = rawMsg => {
            let msg = JSON.parse(rawMsg.data);
            //console.log(msg);

            if (msg.type in this.on) {
                //console.log(this.on, msg.type, this.on[msg.type]);
                this.on[msg.type].dispatch(msg);
            } else {
                console.log('Received unknown message', msg);
            }
        }
    }

    clearListeners() {
        for (let id in this.on) {
            this.on[id].removeAll();
        }
    }

    joinRoom(roomId) {
        this.sendOnOpen({
            type: 'joinRoom',
            roomId: roomId,
            username: this.game.global.username
        });
    }
    leaveRoom() {
        this.send({
            type: 'leaveRoom'
        });
    }

    startGame() {
        this.send({
            type: 'startGame'
        });
    }

    createRoom() {
        this.sendOnOpen({
            type: 'createRoom',
            username: this.game.global.username
        });
    }

    sendExitReady(ready = true) {
        console.log('Ready: ', ready);
        this.send({
            type: 'exitReady',
            ready: ready
        });
    }
    sendDiamondPickup(id) {
        this.send({
            type: 'broadcast',
            body: {
                type: 'diamondPickup',
                id: id
            }
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
                time: this.game.time.now,
                username: this.game.global.username
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
