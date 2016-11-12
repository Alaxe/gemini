'use strict';

const conf = require('./conf.json');
const Player = require('./player.js');
const LocalPlayer = require('./local-player.js');
const OnlinePlayer = require('./online-player.js');
const UseManager = require('./use-highlight.js');

function has_power(tile) {
    return (tile != null) && ((tile.index & 1) == 0);
}

function power_off(tile) {
    if (tile == null) {
        return false;
    } else if (!has_power(tile)) {
        return false;
    } else if (tile.properties.sourcesPower) {
        return false;
    } else {
        tile.index--;
        return true;
    }
}

function power_on(tile) {
    if (tile == null) {
        return false;
    } else if (has_power(tile)) {
        return false;
    } else {
        tile.index++;
        return true;
    }
}

function toggle_switch(tile) {
    if (tile == null) {
        return false;
    } else if ((tile.index == 3) || (tile.index == 4)) {
        tile.index += 2;
        tile.properties.passesPower = true;
        return true;
    } else if ((tile.index == 5) || (tile.index == 6)) {
        tile.index -= 2;
        tile.properties.passesPower = false;

        return true;
    } else {
        return false;
    }
}

class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = new WebSocket(`ws://${document.location.hostname}:7001`);

        this.onlinePlayers = {};

        const self = this;

        this.ws.onopen = () => {
            let url = window.parent.location.pathname;

            console.log(url);

            let gameId = url.substr(url.lastIndexOf('/') + 1);
            self.ws.send(JSON.stringify({
                type: 'connect',
                gameId: gameId
            }));
        }

        this.ws.onmessage = msgStr => {
            let msg = JSON.parse(msgStr.data);
            //console.log('receive');
            //console.log(msg);

            if (msg.type == 'keyframeUpdate') {
                self.keyframeUpdate(msg);
            } else if (msg.type == 'levelUpdate') {

            } else {
                console.log('Received unknown message', msg);
            }
        }
    }

    keyframeUpdate(update) {
        if (! (update.playerId in this.onlinePlayers)) {
            this.onlinePlayers[update.playerId] = new OnlinePlayer(this.game);
        }
        this.onlinePlayers[update.playerId].add_keyframe(update);
    }

    levelUpdate(update) {
    }

    sendUpdate(player) {
        if (this.ws.readyState !== WebSocket.OPEN) {
            return;
        }
        //console.log('send');
        let msg = {
            type: 'broadcast',
            body: {
                type: 'keyframeUpdate',
                x: player.x,
                y: player.y,
                time: this.game.time.now
            }
        };
        //console.log(msg);
        this.ws.send(JSON.stringify(msg));
    }
}

class PlayState {
    constructor() {}

    preload() {
        this.load.image('platforms', '../assets/platforms.png')
        this.load.image('cables', '../assets/cables.png')
        this.load.tilemap('map', '../assets/level.json', null,
            Phaser.Tilemap.TILED_JSON);

        this.load.image('player', '../assets/player.png');
    }
    create() {
        this.create_world();

        this.player = new LocalPlayer(this.game);
        this.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON,
            conf.CAMERA_INTERPOLATION, conf.CAMERA_INTERPOLATION);


        this.useButton = this.input.keyboard.addKey(Phaser.KeyCode.E);

        this.useManager = new UseManager(this.game, this.cableLayer,
                this.player);
        this.useManager.onUse.add(tile => {
            console.log('hi');
            toggle_switch(tile);
            this.simulate_power();
        });

        this.network = new NetworkManager(this.game);
    }

    create_world() {
        this.map = this.add.tilemap('map');
        this.map.addTilesetImage('platforms');
        this.map.addTilesetImage('cables');

        this.cableLayer = this.map.createLayer('cables');
        this.cableLayer.resizeWorld();

        this.platformLayer = this.map.createLayer('platforms');
        this.platformLayer.resizeWorld();

        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = conf.GRAVITY;


        //this.map.setCollision(1, true, 'platforms');
        this.map.setCollision(9, true, 'platforms');

        this.simulate_power();
    }

    simulate_power() {
        let next = Array();

        for (let x = 0;x < this.map.width;x++) {
            for (let y = 0;y < this.map.height;y++) {
                let tile = this.map.getTile(x, y, 'cables');

                power_off(tile);

                if ((tile) && (tile.properties.sourcesPower)) {
                    next.push(tile);
                }
            }
        }

        const adjacent = [
            {x: 1, y: 0},
            {x: -1, y: 0},
            {x: 0, y: 1},
            {x: 0, y: -1}
        ];

        while (next.length > 0) {
            let curTile = next[0];
            next.shift();

            if (!(curTile.properties.passesPower)) {
                continue;
            }

            for (let offset of adjacent) {
                let newX = curTile.x + offset.x;
                let newY = curTile.y + offset.y;

                let newTile = this.map.getTile(newX, newY, 'cables');
                if (power_on(newTile)) {
                    next.push(newTile);
                }
            }
        }
        this.cableLayer.dirty = true;

    }

    update() {
        this.physics.arcade.collide(this.player, this.platformLayer);
        this.network.sendUpdate(this.player);
        //this.player.on_update();
    }
};

module.exports = PlayState;
