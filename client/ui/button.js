'use strict';
const conf = require('../conf.json').Button;
const util = require('./util.js');
const Text = require('./text.js');

class Button extends Phaser.Group {
    constructor(game, x, y, labelText, width, height, options)
    {
        super(game);

        const style = Object.assign({}, conf, options);

        this.x = util.hPx(x);
        this.y = util.vPx(y);
        this.onClick = new Phaser.Signal();

        width = width || style.width;
        height = height || style.height;

        let bgWidthPx = util.hPx(width) - 2 * style.hMargin;
        let bgHeightPx = util.vPx(height) - 2 * style.vMargin;
        let bgXPx = style.hMargin;
        let bgYPx = style.vMargin;
        let bgRadius = style.rectRadius;

        this.bg = game.add.graphics();

        this.bg.beginFill(0xFFFFFFF);
        this.bg.drawRoundedRect(bgXPx, bgYPx, bgWidthPx, bgHeightPx, bgRadius);
        this.bg.endFill();

        this.bg.tint = style.fill;

        this.bg.inputEnabled = true;

        this.bg.events.onInputOver.add(() => {
            this.bg.tint = style.hover;
        })
        this.bg.events.onInputOut.add(() => {
            this.bg.tint = style.fill;
        });
        this.bg.events.onInputDown.add(() => {
            this.onClick.dispatch();
        });

        this.bg.tint = style.fill;

        this.add(this.bg);

        let labelStyle = Object.assign({}, style.Text);

        let labelW = width - util.hPart(style.hMargin);
        let labelH = height - util.vPart(style.vMargin);

        this.label = new Text(game, 0, 0, labelText, labelW, labelH, labelStyle);
        this.add(this.label);

        if (style.enterActivate) {
            let key = game.input.keyboard.addKey(Phaser.KeyCode.ENTER);
            key.onDown.add(() => {
                this.onClick.dispatch();
            });
        }
        this.onClick.add(() => {
            this.game.global.sfx.play('click');
        })
    }

    setText(text) {
        this.label.setText(text);
    }
};

module.exports = Button;
