'use strict';
const conf = require('../conf.json');
const util = require('./util.js');

class Text extends Phaser.Text {
    constructor(game, x, y, text, width, height, options) {
        let style = Object.assign({}, conf.Text, options);

        let xPx = util.hPx(x) + style.hMargin;
        let yPx = util.vPx(y) + style.vMargin;
        super(game, xPx, yPx, text, style);
        this.setTextBounds(0, 0, util.hPx(width) - 2 * style.hMargin,
                util.vPx(height) - 2 * style.vMargin);

        //Redraws the text after the font has loaded
        util.loadFont().then(() => {
            this.setText(text);
        });

        game.add.existing(this);
    }
}

module.exports = Text;
