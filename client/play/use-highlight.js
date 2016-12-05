'use strict';
const conf = require('../conf.json').Highlight;

class UseManager extends Phaser.Graphics {
    constructor(game, level, player) {
        console.log('bollocks');
        super(game, 0, 0);

        super.lineStyle(2, conf.color, 1);
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
        this.useButton.onDown.add(console.log);

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
