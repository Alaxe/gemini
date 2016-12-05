'use strict';
const conf = require('../conf.json');
const util = require('./util.js');

class Text extends Phaser.Text {
    constructor(game, x, y, text, pStyle) {
        let style = Object.assign({}, conf.Text, pStyle);

        let xPx = util.hPx(x);
        let yPx = util.vPx(y);
        super(game, xPx, yPx, text, style);

        if ((style.width) && (style.height)) {
            let widthPx = util.hPx(style.width);
            let heightPx = util.vPx(style.height);

            this.setTextBounds(0, 0, widthPx, heightPx);
        }

        //Redraws the text after the font has loaded
        util.loadFont().then(() => {
            this.setText(text);
        });

        game.add.existing(this);
    }
}

module.exports = Text;
