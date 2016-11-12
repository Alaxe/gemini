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
