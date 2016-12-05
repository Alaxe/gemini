'use strict';
const conf = require('../conf.json').Button;
const util = require('./util.js');
const Text = require('./text.js');

class Button extends Phaser.Group {
    constructor(game, x, y, label, width, height) {
        super(game);

        this.x = util.hPx(x);
        this.y = util.vPx(y);
        this.onClick = new Phaser.Signal();

        width = width || conf.width;
        height = height || conf.height;

        let bgWidthPx = util.hPx(width) - 2 * conf.margin;
        let bgHeightPx = util.vPx(height) - 2 * conf.margin;
        let bgXPx = conf.margin;
        let bgYPx = conf.margin;
        let bgRadius = conf.rectRadius;

        this.bg = game.add.graphics();

        this.bg.beginFill(0xFFFFFFF);
        this.bg.drawRoundedRect(bgXPx, bgYPx, bgWidthPx, bgHeightPx, bgRadius);
        this.bg.endFill();

        this.bg.tint = conf.fill;

        this.bg.inputEnabled = true;

        this.bg.events.onInputOver.add(() => {
            this.bg.tint = conf.hover;
        })
        this.bg.events.onInputOut.add(() => {
            this.bg.tint = conf.fill;
        });
        this.bg.events.onInputDown.add(() => {
            this.onClick.dispatch();
        });

        this.bg.tint = conf.fill;

        this.add(this.bg);

        let textStyle = Object.assign({},
            conf.Text, {
                width: width - util.hPart(conf.margin),
                height: height - util.vPart(conf.margin)
            }
        );

        this.text = new Text(game, 0, 0, label, textStyle);
        this.add(this.text);
    }
};

module.exports = Button;
