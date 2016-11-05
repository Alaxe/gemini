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
        "JUMP_INTERVAL_MS": 750
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
'use strict';
let conf = require('./conf.json');
let PlayState = require('./play-state.js');

let game = new Phaser.Game(conf.GAME_W, conf.GAME_H, Phaser.AUTO, '');

game.state.add('play', new PlayState());
game.state.start('play');

},{"./conf.json":1,"./play-state.js":3}],3:[function(require,module,exports){
'use strict';

const conf = require('./conf.json');
const Player = require('./player.js');
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

class PlayState {
    constructor() {
    }
    preload() {
        this.load.image('platforms', '../assets/platforms.png')
        this.load.image('cables', '../assets/cables.png')
        this.load.tilemap('map', '../assets/level.json', null, 
            Phaser.Tilemap.TILED_JSON);

        this.load.image('player', '../assets/player.png');
    }
    create() {
        //this.stage.backgroundColor = '#555';

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

        //this.camera.y = this.map.heightInPixels - conf.GAME_H;
        this.player = new Player(this.game);
        this.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON, 
            conf.CAMERA_INTERPOLATION, conf.CAMERA_INTERPOLATION);

        this.simulate_power();

        this.useButton = this.input.keyboard.addKey(Phaser.KeyCode.E);
        
        this.useManager = new UseManager(this.game, this.cableLayer, 
                this.player);
        this.useManager.onUse.add(tile => {
            console.log('hi');
            toggle_switch(tile);
            this.simulate_power();
        });
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
        //this.player.on_update();
    }
};

module.exports = PlayState;

},{"./conf.json":1,"./player.js":4,"./use-highlight.js":5}],4:[function(require,module,exports){
const conf = require('./conf.json');

class Player extends Phaser.Sprite {
    constructor(game, x = 0, y = 0) {
        super(game, x, y, 'player');

        this.game.physics.enable(this, Phaser.Physics.ARCADE);
        this.anchor.setTo(0.5, 0.5);
        
        this.body.collideWorldBounds = true;
        this.body.gravity.y = conf.Player.GRAVITY;

        this.body.maxVelocity.y = conf.Player.MAX_VELOCITY.y;
        this.body.maxVelocity.x = conf.Player.MAX_VELOCITY.x;

        this.nextJump = this.game.time.now;

        this.moveButtons = this.game.input.keyboard.createCursorKeys();
        this.jumpButton = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

        this.game.add.existing(this);
    }

    update() {
        let xVelocity = this.body.onFloor()
            ? conf.Player.WALK_VELOCITY
            : conf.Player.AIR_VELOCITY;

        if (this.moveButtons.right.isDown) {
            this.body.velocity.x = xVelocity;
            this.scale.setTo(1, 1);
        } else if (this.moveButtons.left.isDown) {
            this.body.velocity.x = -xVelocity;
            this.scale.setTo(-1, 1);
        } else {
            this.body.velocity.x = 0;
        }

        
        if ((this.body.onFloor()) && (this.jumpButton.isDown) && 
                (this.game.time.now >= this.nextJump)) {

            this.body.velocity.y -= conf.Player.JUMP_VELOCITY;
            this.nextJump = this.game.time.now + conf.Player.JUMP_INTERVAL_MS;
        }
    }
}

module.exports = Player;

},{"./conf.json":1}],5:[function(require,module,exports){
'use strict';
const conf = require('./conf.json').Highlight;

class UseHighlight extends Phaser.Graphics {
    constructor(game, layer, player) {
        super(game, 0, 0);
        super.lineStyle(2, 0xFFFFFF, 1);
        super.drawRect(1, 1, 30, 30);

        this.game.add.existing(this);

        this.layer = layer;
        this.player = player;

        this.tile = null;

        this.useButton = this.game.input.keyboard.addKey(Phaser.KeyCode.E);
        this.onUse = new Phaser.Signal();

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

        //let baseX = this.player.x - this.player.x % this.layer.game.tileWidth;
        //let baseY = this.player.y - this.player.y % this.layer.game.tileHeight;

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

                //console.log(tileX, tileY);

                //console.log(curTile);
                if (curTile) {
                    //console.log('hello');
                }

                if ((curTile) && (curTile.properties.usable)) {
                    let xDist = this.player.x - (tileX + 0.5) * tileW;
                    let yDist = this.player.y - (tileY + 0.6) * tileH;
                    let curDist = Math.abs(xDist) + Math.abs(yDist);
                    
                    //console.log('bingo');
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

module.exports = UseHighlight;

},{"./conf.json":1}]},{},[2]);
