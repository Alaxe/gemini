const conf = require('./conf.json');
const loadFont = require('./load-font.js');

class Button extends Phaser.Group {
    constructor(game, x, y, label, width, height) {
        super(game);

        this.x = x;
        this.y = y;
        this.onClick = new Phaser.Signal();

        width = width || conf.Button.Container.width;
        height = height || conf.Button.Container.height;

        this.background = game.add.graphics();

        this.background.beginFill(0xFFFFFFF);
        this.background.drawRoundedRect(0, 0, width, height,
            conf.Button.Container.rectRadius);
        this.background.endFill();

        this.background.tint = conf.Button.Container.fill;

        this.background.inputEnabled = true;

        this.background.events.onInputOver.add(() => {
            this.background.tint = conf.Button.Container.hover;
        })
        this.background.events.onInputOut.add(() => {
            this.background.tint = conf.Button.Container.fill;
        });
        this.background.events.onInputDown.add(() => {
            this.onClick.dispatch();
        });

        this.background.tint = conf.Button.Container.fill;

        this.add(this.background);


        loadFont().then(() => {
            let textStyle = Object.assign({}, conf.Text, conf.Button.Text);
            console.log(textStyle);
            this.text = game.add.text(0, 0, label, textStyle);

            let padding = conf.Button.Container.padding;

            let textWidth = width - 2 * padding;;
            let textHeight = height - 2 * padding;;

            this.text.setTextBounds(padding, padding, textWidth, textHeight);
            this.add(this.text);
        });
    }
};

module.exports = Button;
