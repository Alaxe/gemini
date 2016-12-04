'use strict';
const conf = require('./conf.json');

const loadFont = require('./load-font.js');
const Button = require('./button.js');
const Text = require('./text.js');

class PickUsername {
    constructor() {}

    preload() {
        loadFont();
        this.add.plugin(Fabrique.Plugins.InputField);
    }
    create() {
        this.stage.backgroundColor = conf.Background.menu;
        
        this.label = new Text(this.game, 250, 200, 'Pick a username', {
            width: 300,
            height: 50
        });

        let inputStyle = Object.assign({}, conf.InputField, {
            width: 290,
            placeHolder: "Username"
        });
        this.input = this.add.inputField(250, 250, inputStyle);
        this.button = new Button(this.game, 250, 300, 'Start', 300, 40);

        this.button.onClick.add(() => {
            this.game.global.username = this.input.value;
            this.game.state.start('mainMenu');
        });
    }
};

module.exports = PickUsername;
