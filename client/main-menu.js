const conf = require('./conf.json');

const loadFont = require('./load-font.js');
const Button = require('./button.js');

class MainMenu {
    constructor() {}

    init() {}
    preload() {
        loadFont();
    }
    create() {
        this.button = new Button(this.game, 300, 200, 'Start', 200, 100);
        this.stage.backgroundColor = conf.Menu.background;

        this.button.onClick.add(() => {
            this.game.state.start('play');
        });
    }

};

module.exports = MainMenu;
