'use strict';
const conf = require('../conf.json');

const sides = [
    {x: 0, y: -1},
    {x: 1, y: 0},
    {x: 0, y: 1},
    {x: -1, y: 0}
];

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

function rotateMask(mask, rotationRad) {
    let rotCnt = Math.round(rotationRad / Math.PI * 2);
    let firstMask = mask;
    for (let i = 0;i < rotCnt;i++) {
        mask = ((mask & 7) << 1) + ((mask & 8) >> 3);
    }

    return mask;
}

class LogicNetwork {
    constructor(tileMap) {
        this.map = tileMap;
        this.platformLayer = tileMap.layers[tileMap.getLayer('platforms')];
        this.cableLayer = tileMap.layers[tileMap.getLayer('cables')];

        this.rotateTileEnds();
        this.initializeTileProperties();

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

    initializeTileProperties() {
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
                    if (prop.underground) {
                        prop.underground = rotateMask(prop.underground, rotation);
                    }
                } else if (prop.type === 'logic') {
                    prop.input = rotateMask(prop.input, rotation);
                    prop.output = rotateMask(prop.output, rotation);
                }
            }
        }
    }

    getDirectAdjacent(tile) {
        let ans = [];
        if (tile.properties.type !== 'cable') {
            return ans;
        }

        for (let i = 0;i < sides.length;i++) {
            let curBit = 1 << i;
            let newBit = 1 << ((i + 2) % 4);

            if (!(tile.properties.ends & curBit)) {
                continue;
            }

            let newX = tile.x + sides[i].x;
            let newY = tile.y + sides[i].y;

            let newTile = this.map.getTile(newX, newY, 'cables');
            if (newTile == null) {
                continue;
            }

            if (newTile.properties.type === 'cable') {
                if (!(newTile.properties.ends & newBit)) {
                    continue;
                } else if (newTile.properties.component) {
                    continue;
                } else {
                    ans.push({
                        type: 'cable',
                        tile: newTile
                    });
                }
            } else if (newTile.properties.type === 'logic') {
                if (newTile.properties.input & newBit) {
                    ans.push({
                        type: 'output',
                        tile: newTile
                    });
                } else if (newTile.properties.output & newBit) {
                    ans.push({
                        type: 'input',
                        tile: newTile
                    });
                }
            }
        }

        return ans;
    }
    getUndergroundAdjacent(tile) {
        let ans = [];
        if (tile.properties.type !== 'cable') {
            return ans;
        }

        for (let i = 0;i < sides.length;i++) {
            let curBit = 1 << i;
            let newBit = 1 << ((i + 2) % 4);

            if (!(tile.properties.underground & curBit)) {
                continue;
            }

            for (let j = 1;j <= conf.Level.UNDERGROUND_RANGE;j++) {
                let newX = tile.x + sides[i].x * j;
                let newY = tile.y + sides[i].y * j;

                let newTile = this.map.getTile(newX, newY, 'cables');

                if (newTile === null) {
                    continue;
                } else if (newTile.properties.type !== 'cable') {
                    continue;
                } else if (!newTile.properties.underground) {
                    continue;
                } else if (newTile.properties.component) {
                    continue;
                }

                if (newTile.properties.underground & newBit) {
                    ans.push({
                        type: 'cable',
                        tile: newTile
                    });
                    break;
                } else if (newTile.properties.underground & curBit) {
                    break;
                }
            }
        }

        return ans;
    }
    buildComponent(startTile) {
        let cc = new CableComponent();
        cc.addCable(startTile);

        let queue = [startTile];

        
        while (queue.length > 0) {
            let curTile = queue[0];
            queue.shift();

            let direct = this.getDirectAdjacent(curTile);
            let underground = this.getUndergroundAdjacent(curTile);
            console.log('Direct', direct);

            let adjacent = direct.concat(underground);

            for (let cur of adjacent) {
                if (cur.type === 'cable') {
                    cc.addCable(cur.tile);
                    queue.push(cur.tile);
                } else if (cur.type === 'input') {
                    cc.addInput(cur.tile);
                } else if (cur.type === 'output') {
                    cc.addOutput(cur.tile);
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

    simulatePower() {
        let queue = [];
        for (let cc of this.cableComponents) {
            cc.inputsLeft = cc.input.length;
            cc.hasInput = false;

            if (cc.inputsLeft == 0) {
                queue.push(cc);
            }
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

module.exports = LogicNetwork;
