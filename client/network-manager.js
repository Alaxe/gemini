'use strict';
const conf = require('./conf.json');

class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = new WebSocket(`ws://${document.location.hostname}:7001`);

        this.meanTimeDiff = 0;
        this.meanSampleCnt = 0;

        this.on = {
            diamondPickup: new Phaser.Signal(),
            joinError: new Phaser.Signal(),
            keyframeUpdate: new Phaser.Signal(),
            levelFinish: new Phaser.Signal(),
            lobbyError: new Phaser.Signal(),
            roomUpdate: new Phaser.Signal(),
            tileUpdate: new Phaser.Signal(),
            SFXPlay: new Phaser.Signal(),
            startGame: new Phaser.Signal()
        };
        this.ws.onmessage = rawMsg => {
            let msg = JSON.parse(rawMsg.data);

            if (msg.type in this.on) {
                if (msg.time) {
                    let timeDiff = this.game.time.now - msg.time;
                    this.meanTimeDiff *= this.meanSampleCnt /
                            (this.meanSampleCnt + 1);
                    this.meanTimeDiff += timeDiff / ++this.meanSampleCnt;

                    msg.time += this.meanTimeDiff +
                            conf.Network.INTERPOLATION_DELAY_MS;
                }


                if ((msg.time) && !(msg.dispatchDirectly)) {
                    let timer = this.game.time.create();
                    timer.add(msg.time - this.game.time.now, () => {
                        this.on[msg.type].dispatch(msg);
                    });

                    timer.start();
                    console.log(msg);
                    console.log(msg.time - this.game.time.now);
                } else {
                    this.on[msg.type].dispatch(msg);
                }
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

    selectLevel(levelInd) {
        this.send({
            type: 'levelSelect',
            levelIndex: levelInd
        });
    }

    joinRoom(roomId) {
        this.sendOnOpen({
            type: 'joinRoom',
            roomId: roomId,
            username: localStorage.getItem('username')
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
            username: localStorage.getItem('username')
        });
    }

    sendExitReady(ready = true) {
        this.send({
            type: 'exitReady',
            time: this.game.time.now,
            ready: ready
        });
    }
    sendDiamondPickup(id) {
        this.send({
            type: 'broadcast',
            body: {
                type: 'diamondPickup',
                time: this.game.time.now,
                id: id

            }
        });
    }
    sendTileUpdate(tile) {
        this.send({
            type: 'broadcast',
            body: {
                type: 'tileUpdate',
                x: tile.x,
                y: tile.y,
                layer: tile.layer.name,
                index: tile.index,
                time: this.game.time.now,
                properties: {
                    onUseId: tile.properties.onUseId
                }
            }
        });
    }
    sendSFXPlay(effect, x, y) {
        this.send({
            type: 'broadcast',
            body: {
                type: 'SFXPlay',
                effect: effect,
                x: x,
                y: y,
                time: this.game.time.now
            }
        });
        console.log('sending');
    }

    sendKeyframe(player) {
        this.send({
            type: 'broadcast',
            body: {
                type: 'keyframeUpdate',
                x: player.x,
                y: player.y,
                time: this.game.time.now,
                dispatchDirectly: true,
                username: localStorage.getItem('username')
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
