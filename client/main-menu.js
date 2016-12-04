const conf = require('./conf.json');

const loadFont = require('./load-font.js');
const Button = require('./button.js');
const Text = require('./text.js');

class MainMenu {
    constructor() {}

    init() {}
    preload() {
        loadFont();
        this.add.plugin(Fabrique.Plugins.InputField);
    }
    create() {
        this.stage.backgroundColor = conf.Background.menu;

        this.title = new Text(this.game, 250, 190, 'Start a game', 
        {
            width:300, 
            height: 50,
        });

        this.createRoom = new Button(this.game, 250, 240, 'Create a room', 
                300, 40);
        this.joinRoom = new Button(this.game, 250, 300, 'Join a room', 300, 40);

        this.createRoom.onClick.add(() => {
            this.game.state.start('play');
        });
        this.joinRoom.onClick.add(() => {
        });

    }
};

module.exports = MainMenu;
