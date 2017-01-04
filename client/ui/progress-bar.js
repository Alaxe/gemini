'use strict';

const conf = require('../conf.json');
const util = require('./util.js');

class ProgressBar extends Phaser.Graphics {
    constructor(game, x, y, options) {
        super(game);
        this.game.add.existing(this);
        this.style = Object.assign({}, conf.ProgressBar, options);

        this.xPx = util.hPx(x);
        this.yPx = util.vPx(y);
        this.widthPx = util.hPx(this.style.width);
        this.heightPx = util.vPx(this.style.height);
        this.progress = this.style.initalProgress;

        this.draw();
    }

    draw() {
        this.beginFill(this.style.background);
        this.drawRect(this.xPx, this.yPx, this.widthPx, this.heightPx);
        this.endFill();

        let progressWidth = this.progress * this.widthPx;
        this.beginFill(this.style.fill);
        this.drawRect(this.xPx, this.yPx, progressWidth, this.heightPx);
        this.endFill();
    }

    setProgress(progress) {
        this.progress = progress;
        this.draw();
    }

};
module.exports = ProgressBar;
