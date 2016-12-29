'use strict';
const conf = require('../conf.json');
const levelData = require('../level-data.json');

const ui = require('../ui');

function rotateMask(mask, rotationRad) {
    let rotCnt = Math.round(rotationRad / Math.PI * 2);
    let firstMask = mask;
    for (let i = 0;i < rotCnt;i++) {
        mask = ((mask & 7) << 1) + ((mask & 8) >> 3);
    }

    return mask;
}

class LogicBlock {
    constructor(tile) {
        this.tile = tile;
        this.inCC = null;
        this.outCC = null;

        this.hasInput = false;
        this.calcOutput();
    }

    calcOutput() {

        if ((this.hasInput) && (this.tile.index & 1)) {
            this.tile.index++;
        } else if ((!this.hasInput) && ((this.tile.index & 1) == 0)) {
            this.tile.index--;
        }

        if (this.hasInput) {

        }
        const outputIds = [9, 10, 12, 13, 18];
        this.hasOutput = outputIds.includes(this.tile.index);
    }
}

class CableComponent {
    constructor() {
        this.tiles = [];
        this.input = [];
        this.output = [];

        this.inputsLeft = 0;
        this.hasInput = false;
    }

    setPower(power) {
        for (let tile of this.tiles) {
            let baseIndex = tile.index;
            if ((tile.index & 1) == 0) {
                baseIndex--;
            }

            tile.index = power
                ? baseIndex + 1
                : baseIndex;
        }
    }

    addCable(tile) {
        if (tile.properties.type !== 'cable') {
            throw new Error(tile);
        }

        this.tiles.push(tile);
        tile.properties.component = this;
    }

    addOutput(tile) {
        let block = tile.properties.block;

        this.output.push(block);
        block.inCC = this;
    }

    addInput(tile) {
        let block = tile.properties.block;

        this.input.push(block);
        block.outCC = this;
    }
}

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

        this.diamonds = this.game.add.group();
        this.helpTexts = this.game.add.group();
        this.spawns = [];

        let diamondCnt = 0;
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
                cur.index = diamondCnt++;
                this.diamonds.add(cur);
            } else if (object.type === 'spawn') {
                this.spawns.push({
                    x: object.x + object.width / 2,
                    y: object.y + object.height / 2
                });
            }
        }
        this.game.physics.enable(this.diamonds, Phaser.Physics.ARCADE);

        this.buildNetwork();
        this.simulatePower();

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

    onUseTile(tile) {
        if (this.constructor.useTile(tile)) {
            this.simulatePower();
            this.onTileChange.dispatch(tile);
        }
    }

    onTileUpdate(msg) {
        let tile = this.map.getTile(msg.x, msg.y, msg.layer, true);

        tile.index = msg.index;
        tile.properties.onUseId = msg.properties.onUseId;

        this.map.putTile(tile, msg.x, msg.y, msg.layer);

        if (msg.layer == 'cables') {
            this.simulatePower();
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

    initNetwork() {
        this.cableComponents = [];
        this.logicBlocks = [];

        for (let x = 0;x < this.map.width;x++) {
            for (let y = 0;y < this.map.height;y++) {
                let tile = this.map.getTile(x, y, 'cables');

                if (tile == null) {
                    continue;
                }
                tile.properties.component = null;

                if (tile.properties.type === 'logic') {
                    tile.properties.block = new LogicBlock(tile);
                    this.logicBlocks.push(tile.properties.block);
                }
            }
        }
    }

    rotateTileEnds() {
        for (let x = 0;x < this.map.width;x++) {
            for (let y = 0;y < this.map.height;y++) {
                let tile = this.map.getTile(x, y, 'cables');
                if (tile === null) {
                    continue;
                }

                let prop = tile.properties;
                let rotation = tile.rotation;

                if (prop.type === 'cable') {
                    prop.ends = rotateMask(prop.ends, rotation);
                } else if (prop.type === 'logic') {
                    prop.input = rotateMask(prop.input, rotation);
                    prop.output = rotateMask(prop.output, rotation);
                }
            }
        }
    }

    getLogicBlock(tile) {
        if (tile.properties.type !== 'logic') {
            throw new Error(tile);
        }
        if (!tile.block) {
            tile.block =  new LogicBlock(tile);
        }
        return tile.block;
    }

    buildComponent(startTile) {
        let cc = new CableComponent();
        cc.addCable(startTile);

        let queue = [startTile];

        const sides = [
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: -1, y: 0}
        ];

        while (queue.length > 0) {
            let curTile = queue[0];
            queue.shift();

            for (let i = 0;i < sides.length;i++) {
                let curBit = 1 << i;
                let newBit = 1 << ((i + 2) % 4);

                if (!(curTile.properties.ends & curBit)) {
                    continue;
                }

                let newX = curTile.x + sides[i].x;
                let newY = curTile.y + sides[i].y;

                let newTile = this.map.getTile(newX, newY, 'cables');
                if (newTile == null) {
                    continue;
                }

                if (newTile.properties.type === 'cable') {
                    if ((newTile.properties.ends & newBit) &&
                            (!newTile.properties.component)) {
                        cc.addCable(newTile);
                        queue.push(newTile);
                    }
                } else if (newTile.properties.type === 'logic') {
                    if (newTile.properties.input & newBit) {
                        cc.addOutput(newTile);
                    } else if (newTile.properties.output & newBit) {
                        cc.addInput(newTile);
                    }
                }
            }
        }
        return cc;
    }

    connectLogicBlocks() {
        for (let block of this.logicBlocks) {
            if (!block.outCC) {
                block.outCC = new CableComponent();
                block.outCC.addInput(block.tile);

                const sides = [
                    {x: 0, y: -1},
                    {x: 1, y: 0},
                    {x: 0, y: 1},
                    {x: -1, y: 0}
                ];
                for (let i = 0;i < sides.length;i++) {
                    if ((block.tile.properties.output & (1 << i)) == 0) {
                        continue;
                    }

                    let nX = block.tile.x + sides[i].x;
                    let nY = block.tile.y + sides[i].y;

                    let nTile = this.map.getTile(nX, nY, 'cables');

                    if ((nTile == null) || (nTile.properties.type != 'logic')) {
                        continue;
                    }

                    block.outCC.addOutput(nTile);
                }

                this.cableComponents.push(block.outCC);
            }
        }

        for (let block of this.logicBlocks) {
            if (!block.inCC) {
                block.inCC = new CableComponent();
                block.inCC.addOutput(block.tile);

                this.cableComponents.push(block.inCC);
            }
        }
    }

    findHolograms() {
        this.holograms = [];

        for (let x = 0;x < this.map.width;x++) {
            for (let y = 0;y < this.map.height;y++) {
                let tile = this.map.getTile(x, y, 'platforms');
                if ((tile != null) && ((tile.index == conf.Level.Hologram.ON) ||
                        (tile.index == conf.Level.Hologram.OFF))) {
                    let cableTile = this.map.getTile(x, y, 'cables');

                    tile.properties.component = cableTile !== null
                        ? cableTile.properties.component
                        : null;
                    this.holograms.push(tile);
                }
            }
        }
    }

    buildNetwork() {
        this.rotateTileEnds();
        this.initNetwork();

        for (let x = 0;x < this.map.width;x++) {
            for (let y = 0;y < this.map.height;y++) {
                let tile = this.map.getTile(x, y, 'cables');
                if (tile === null) {
                    continue;
                }

                if ((tile.properties.type === 'cable') &&
                        (tile.properties.component == null)) {
                    this.cableComponents.push(this.buildComponent(tile));
                }
            }
        }

        this.findHolograms();
        this.connectLogicBlocks();
    }

    simulatePower() {
        let queue = [];
        for (let cc of this.cableComponents) {
            cc.inputsLeft = cc.input.length;
            cc.hasInput = false;

            if (cc.inputsLeft == 0) {
                queue.push(cc);
            }
            //i.setPower(Math.round(Math.random()));
        }

        while (queue.length > 0) {
            let cur = queue[0];
            queue.shift();

            cur.setPower(cur.hasInput);

            for (let block of cur.output) {
                block.hasInput = cur.hasInput;
                block.calcOutput();

                block.outCC.hasInput = block.outCC.hasInput || block.hasOutput;
                block.outCC.inputsLeft--;

                if (block.outCC.inputsLeft == 0) {
                    queue.push(block.outCC);
                }
            }
        }

        this.cableLayer.dirty = true;

        this.powerHolograms();
    }

    powerHolograms() {
        for (let hologram of this.holograms) {
            let hasPower = hologram.properties.component
                ? hologram.properties.component.hasInput
                : false;

            hologram.index = hasPower
                ? conf.Level.Hologram.ON
                : conf.Level.Hologram.OFF;
            this.map.putTile(hologram, hologram.x, hologram.y, 'platforms');
        }
        this.platformLayer.dirty = true;
    }

}
module.exports = Level;
