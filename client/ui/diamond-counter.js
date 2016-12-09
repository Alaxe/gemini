const conf = require('../conf.json').DiamondCounter;

const Text = require('./text.js');
const util = require('./util.js');

class DiamondCounter extends Phaser.Group {
    constructor(game, initialCount = 0) {
        super(game);
        this.icon = game.add.sprite(conf.margin, conf.margin, 'diamond');
        this.add(this.icon);

        this.count = initialCount;
        let textX = util.hPart(2 * conf.margin + this.icon.width);
        let textY = util.vPart(conf.margin);
        this.text = new Text(game, textX, textY, initialCount.toString(),
                conf.textWidth, conf.textHeight, conf.textStyle);

        this.add(this.text);

        this.fixedToCamera = true;
    }

    increment() {
        this.count++;
        this.text.setText(this.count.toString());
    }
};

module.exports = DiamondCounter;
