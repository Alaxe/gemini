'use strict';
const conf = require('../conf.json');
const levelData = require('../level-data.json');
const LogicNetwork = require('./logic-network.js');

const ui = require('../ui');

class Level {
    constructor(game, levelIndex) {
        this.onTileChange = new Phaser.Signal();

        this.game = game;

        this.map = this.game.add.tilemap('map-' + levelIndex);
        this.map.addTilesetImage('platforms');
        this.map.addTilesetImage('cables');

        this.cableLayer = this.map.createLayer('cables');
        this.cableLayer.resizeWorld();

        this.platformLayer = this.map.createLayer('platforms');
        this.platformLayer.resizeWorld();

        this.addObjects();
        
        this.logicNetwork = new LogicNetwork(this.map);
        this.logicNetwork.simulatePower();

        this.map.setCollision(conf.Level.COLLISION_TILE_ID, true, 'platforms');

        this.map.setTileIndexCallback(conf.Level.EXIT_BLOCK_ID,
        (sprite, tile) => {
            if (sprite.onExitBlockCollide) {
                sprite.onExitBlockCollide.dispatch(tile);
            }
            return true;
        }, this, 'platforms');

    }

    static loadTilemap(game, levelIndex) {
        let mapPath = levelData[levelIndex].path;
        game.load.tilemap('map-' + levelIndex, mapPath, null,
                Phaser.Tilemap.TILED_JSON);
    }

    static useTile(tile) {
        if ((tile == null) || (!tile.properties.usable)) {
            return false;
        } else {
            let oldIndex = tile.index;

            tile.index = tile.properties.onUseId;
            tile.properties.onUseId = oldIndex;


            return true;
        }
    }

    addObjects() {
        this.diamonds = this.game.add.group();
        this.helpTexts = this.game.add.group();
        this.spawns = [];

        this.diamondCount = 0;
        for (let object of this.map.objects.objects) {
            if (object.type === 'text') {
                this.helpTexts.add(new ui.Text(
                    this.game,
                    ui.util.hPart(object.x),
                    ui.util.vPart(object.y),
                    object.properties.text,
                    ui.util.hPart(object.width),
                    ui.util.vPart(object.height),
                    conf.Level.HelpText
                ));
            } else if (object.type === 'diamond') {
                let cur = this.game.add.sprite(object.x,
                        object.y, 'diamond');
                cur.y -= cur.height;
                cur.index = this.diamondCount++;
                this.diamonds.add(cur);
            } else if (object.type === 'spawn') {
                this.spawns.push({
                    x: object.x + object.width / 2,
                    y: object.y + object.height / 2
                });
            }
        }
        this.game.physics.enable(this.diamonds, Phaser.Physics.ARCADE);
    }

    onUseTile(tile) {
        if (this.constructor.useTile(tile)) {
            this.logicNetwork.simulatePower();
            this.onTileChange.dispatch(tile);
        }
    }

    onTileUpdate(msg) {
        let tile = this.map.getTile(msg.x, msg.y, msg.layer, true);

        tile.index = msg.index;
        tile.properties.onUseId = msg.properties.onUseId;

        this.map.putTile(tile, msg.x, msg.y, msg.layer);

        if (msg.layer == 'cables') {
            this.logicNetwork.simulatePower();
        }
    }

    getSpawnPosition(spawnIndex = 0) {
        if (this.spawns.length === 0) {
            return {x: 0, y: 0}
        } else if (this.spawns.length === 1) {
            return this.spawns[0];
        } else {
            return this.spawns[spawnIndex];
        }
    }

}
module.exports = Level;
