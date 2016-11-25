(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports={
    "GAME_W": 800,
    "GAME_H": 500,
    "GRAVITY": 0,
    "CAMERA_INTERPOLATION": 0.1,
    "Player": {
        "GRAVITY": 1600,
        "MAX_VELOCITY": {
            "x": 400,
            "y": 1500
        },
        "WALK_VELOCITY": 800,
        "AIR_VELOCITY": 300,
        "JUMP_VELOCITY": 800,
        "JUMP_INTERVAL_MS": 750,
        "INTERPOLATION_DELAY_MS": 100
    },
    "Highlight": {
        "Y": {
            "min": -1,
            "max": -1
        },
        "X": {
            "min": 0,
            "max": 2
        }
    }
}

},{}],2:[function(require,module,exports){
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

class Level {
    constructor(game) {
        this.onTileChange = new Phaser.Signal();

        this.game = game;

        this.map = this.game.add.tilemap('map');
        this.map.addTilesetImage('platforms');
        this.map.addTilesetImage('cables');

        this.cableLayer = this.map.createLayer('cables');
        this.cableLayer.resizeWorld();

        this.platformLayer = this.map.createLayer('platforms');
        this.platformLayer.resizeWorld();

        this.map.setCollision(9, true, 'platforms');

        this.simulatePower();
    }

    static useTile(tile) {
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

    onUseTile(tile) {
        if (this.constructor.useTile(tile)) {
            this.simulatePower();
            console.log(tile);
            this.onTileChange.dispatch(tile);
        }
    }
    onTileUpdate(msg) {
        let tile = this.map.getTile(msg.x, msg.y, msg.layer, true);

        tile.index = msg.index;
        tile.properties = msg.properties;

        this.map.putTile(tile, msg.x, msg.y, msg.layer);

        if (msg.layer == 'cables') {
            this.simulatePower();
        }
    }

    simulatePower() {
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
}
module.exports = Level;

},{}],3:[function(require,module,exports){
const conf = require('./conf.json');
const Player = require('./player.js');

class LocalPlayer extends Player {
    constructor(game, x = 0, y = 0) {
        super(game, x, y);

        this.game.physics.enable(this, Phaser.Physics.ARCADE);

        this.body.collideWorldBounds = true;
        this.body.gravity.y = conf.Player.GRAVITY;

        this.body.maxVelocity.y = conf.Player.MAX_VELOCITY.y;
        this.body.maxVelocity.x = conf.Player.MAX_VELOCITY.x;

        this.nextJump = this.game.time.now;

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.jump = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

    }

    update() {
        let xVelocity = this.body.onFloor()
            ? conf.Player.WALK_VELOCITY
            : conf.Player.AIR_VELOCITY;

        if (this.cursors.right.isDown) {
            this.body.velocity.x = xVelocity;
        } else if (this.cursors.left.isDown) {
            this.body.velocity.x = -xVelocity;
        } else {
            this.body.velocity.x = 0;
        }


        if ((this.body.onFloor()) && (this.jump.isDown) &&
                (this.game.time.now >= this.nextJump)) {

            this.body.velocity.y -= conf.Player.JUMP_VELOCITY;
            this.nextJump = this.game.time.now + conf.Player.JUMP_INTERVAL_MS;
        }

        if (this.body.velocity.x < 0) {
            this.scale.setTo(-1, 1);
        } else if (this.body.velocity.x > 0) {
            this.scale.setTo(1, 1);
        }
    }
}

module.exports = LocalPlayer;

},{"./conf.json":1,"./player.js":9}],4:[function(require,module,exports){
'use strict';
let conf = require('./conf.json');
let PlayState = require('./play-state.js');

let game = new Phaser.Game(conf.GAME_W, conf.GAME_H, Phaser.WEBGL, '');

game.state.add('play', new PlayState());
game.state.start('play');

},{"./conf.json":1,"./play-state.js":8}],5:[function(require,module,exports){
class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = new WebSocket(`ws://${document.location.hostname}:7001`);

        //this.onlinePlayers = {};
        this.onKeyframeUpdate = new Phaser.Signal();
        this.onTileUpdate = new Phaser.Signal();

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

            if (msg.type == 'keyframeUpdate') {
                self.onKeyframeUpdate.dispatch(msg);
            } else if (msg.type == 'tileUpdate') {
                self.onTileUpdate.dispatch(msg);
            } else {
                console.log('Received unknown message', msg);
            }
        }
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
                properties: tile.properties
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

    send(json) {
        if (this.ws.readyState !== WebSocket.OPEN) {
            return false;
        } else {
            this.ws.send(JSON.stringify(json));
        }
    }
}

module.exports = NetworkManager;

},{}],6:[function(require,module,exports){
const OnlinePlayer = require('./online-player.js');

class OnlinePlayerManager {
    constructor(game, network) {
        this.game = game;
        this.playersById = {}
    }

    getPlayerById(id) {
        if (!(id in this.playersById)) {
            this.playersById[id] = new OnlinePlayer(this.game);
        }
        return this.playersById[id];
    }

    handleKeyframeUpdate(msg) {
        let player = this.getPlayerById(msg.playerId);
        player.addKeyframe(msg);
    }
}
module.exports = OnlinePlayerManager;

},{"./online-player.js":7}],7:[function(require,module,exports){
const Player = require('./player.js');
const conf = require('./conf.json');

let onlinePlayersById = {}

class OnlinePlayer extends Player {
    constructor(game) {
        super(game);
        this.keyframes = [];

        this.meanTimeDiff = 0;
        this.meanSampleCnt = 0;
    }

    static handleKeyframeUpdate(msg) {

    }

    addKeyframe(msg) {
        this.keyframes.push(msg);

        if (this.keyframes.length == 1) {
            this.x = this.keyframes[0].x;
            this.y = this.keyframes[0].y;
        }

        let timeDiff = this.game.time.now - msg.time;

        this.meanTimeDiff *= this.meanSampleCnt / (this.meanSampleCnt + 1);
        this.meanSampleCnt++;

        this.meanTimeDiff += timeDiff / this.meanSampleCnt;
    }
    update() {
        let netNow = this.game.time.now
                - conf.Player.INTERPOLATION_DELAY_MS
                - this.meanTimeDiff;

        while ((this.keyframes.length > 1) && (this.keyframes[1].time < netNow)) {
            this.keyframes.shift();
        }

        let prev = this.keyframes[0];
        if (this.keyframes.length > 1) {
            let next = this.keyframes[1];

            let traversedPart = (netNow - prev.time) / (next.time - prev.time);

            this.x = prev.x + (next.x - prev.x) * traversedPart;
            this.y = prev.y + (next.y - prev.y) * traversedPart;
        } else {
            //console.log('Not enough keyframes');
            this.x = prev.x;
            this.y = prev.y;
        }
    }
}

module.exports = OnlinePlayer;

},{"./conf.json":1,"./player.js":9}],8:[function(require,module,exports){
'use strict';

const conf = require('./conf.json');

const Player = require('./player.js');
const LocalPlayer = require('./local-player.js');
const OnlinePlayerManager = require('./online-player-manager.js');

const NetworkManager = require('./network-manager.js');
const Level = require('./level.js');
const UseManager = require('./use-highlight.js');


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
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = conf.GRAVITY;

        this.level = new Level(this.game);

        this.player = new LocalPlayer(this.game);
        this.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON,
            conf.CAMERA_INTERPOLATION, conf.CAMERA_INTERPOLATION);

        this.network = new NetworkManager(this.game);

        this.useManager = new UseManager(this.game, this.level,
                this.player);

        this.level.onTileChange.add(this.network.sendTileUpdate
                .bind(this.network));

        this.onlinePlayerManager = new OnlinePlayerManager(this.game);
        this.network.onKeyframeUpdate.add(this
            .onlinePlayerManager
            .handleKeyframeUpdate
            .bind(this.onlinePlayerManager));

        this.network.onTileUpdate.add(this.level.onTileUpdate.bind(this.level));
        this.network.onTileUpdate.add(console.log);
    }

    update() {
        this.physics.arcade.collide(this.player, this.level.platformLayer);
        this.network.sendKeyframe(this.player);
    }
};

module.exports = PlayState;

},{"./conf.json":1,"./level.js":2,"./local-player.js":3,"./network-manager.js":5,"./online-player-manager.js":6,"./player.js":9,"./use-highlight.js":10}],9:[function(require,module,exports){
const conf = require('./conf.json');

class Player extends Phaser.Sprite {
    constructor(game, x = 0, y = 0) {
        super(game, x, y, 'player');

        ///Should add animations

        this.anchor.setTo(0.5, 0.5);
        this.game.add.existing(this);
    }
}

module.exports = Player;

},{"./conf.json":1}],10:[function(require,module,exports){
'use strict';
const conf = require('./conf.json').Highlight;

class UseManager extends Phaser.Graphics {
    constructor(game, level, player) {
        super(game, 0, 0);
        super.lineStyle(2, 0xFFFFFF, 1);
        super.drawRect(1, 1, 30, 30);

        this.game.add.existing(this);

        this.layer = level.cableLayer;
        this.player = player;

        this.tile = null;

        this.useButton = this.game.input.keyboard.addKey(Phaser.KeyCode.E);
        this.onUse = new Phaser.Signal();

        this.onUse.add(level.onUseTile.bind(level));

        this.useButton.onDown.add(key => {
            if (this.tile) {
                this.onUse.dispatch(this.tile);
            }
        });

    }

    update() {
        this.tile = null;
        this.visible = false;

        if (!this.player.body.onFloor()) {
            return;
        }

        let tileW = this.layer.map.tileWidth;
        let tileH = this.layer.map.tileHeight;

        let bestDist;

        for (let dY = conf.Y.min;dY <= conf.Y.max;dY++) {
            for (let dX = conf.X.min;dX <= conf.X.max;dX++) {
                let newX = this.player.x + this.player.scale.x * dX * tileW;
                let newY = this.player.y + this.player.scale.y * dY * tileH;

                let tileX = this.layer.getTileX(newX);
                let tileY = this.layer.getTileY(newY);

                let curTile = this.layer.map.getTile(tileX, tileY, this.layer);

                if ((curTile) && (curTile.properties.usable)) {
                    let xDist = this.player.x - (tileX + 0.5) * tileW;
                    let yDist = this.player.y - (tileY + 0.6) * tileH;
                    let curDist = Math.abs(xDist) + Math.abs(yDist);

                    if ((this.tile == null) || (curDist < bestDist)) {
                        this.tile = curTile;
                        bestDist = curDist;
                    }
                }
            }
        }

        if (this.tile) {
            this.visible = true;
            this.x = this.tile.worldX;
            this.y = this.tile.worldY;
        }
    }
}

module.exports = UseManager;

},{"./conf.json":1}]},{},[4]);
