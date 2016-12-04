const conf = require('./conf.json');
const loadFont = require('./load-font.js');

class Text extends Phaser.Text {
    constructor(game, x, y, text, pStyle) {
        let style = Object.assign({}, conf.Text, pStyle);
        super(game, x, y, text, style);

        if ((style.width) && (style.height)) {
            this.setTextBounds(
                style.padding,
                style.padding,
                style.width - 2 * style.padding,
                style.height - 2 * style.padding
            );
        }

        loadFont().then(() => {
            this.setText(text);
        });

        game.add.existing(this);
    }
}

module.exports = Text;
