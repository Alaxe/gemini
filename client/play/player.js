'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class Player extends Phaser.Sprite {
    constructor(game, username, x = 0, y = 0) {
        super(game, x, y, 'player');
        let labelWidth = ui.util.hPart(conf.Player.Label.widthPx);
        let labelHeight = ui.util.hPart(conf.Player.Label.heightPx);

        this.labelX = -labelWidth * 0.5;
        this.labelY = ui.util.vPart(-0.5 * this.height) - labelHeight;

        let labelStyle = Object.assign({}, conf.Player.Label);
        this.label = new ui.Text(game, this.labelX, this.labelY, username,
                labelWidth, labelHeight, labelStyle);
        this.addChild(this.label);

        this.anchor.setTo(0.5, 0.5);
        this.game.add.existing(this);
        //console.log(this.left);
    }
    setLookDirection(xDirection) {
        this.scale.setTo(xDirection, 1);
        this.label.scale.setTo(xDirection, 1);
        this.label.x = xDirection * ui.util.hPx(this.labelX);
    }
    update() {}
}

module.exports = Player;
