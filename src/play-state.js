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
