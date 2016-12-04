const conf = require('./conf.json');
const Text = require('./text.js');

class Button extends Phaser.Group {
    constructor(game, x, y, label, width, height) {
        super(game);

        this.x = x;
        this.y = y;
        this.onClick = new Phaser.Signal();

        width = width || conf.Button.width;
        height = height || conf.Button.height;

        this.background = game.add.graphics();

        this.background.beginFill(0xFFFFFFF);
        this.background.drawRoundedRect(0, 0, width, height,
            conf.Button.rectRadius);
        this.background.endFill();

        this.background.tint = conf.Button.fill;

        this.background.inputEnabled = true;

        this.background.events.onInputOver.add(() => {
            this.background.tint = conf.Button.hover;
        })
        this.background.events.onInputOut.add(() => {
            this.background.tint = conf.Button.fill;
        });
        this.background.events.onInputDown.add(() => {
            this.onClick.dispatch();
        });

        this.background.tint = conf.Button.fill;

        this.add(this.background);

        this.text = new Text(game, 0, 0, label, Object.assign(
            {},
            conf.Button.Text,
            {
                width: width,
                height: height
            }
        ));
        this.add(this.text);
    }
};

module.exports = Button;
