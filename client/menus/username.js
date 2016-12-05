'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class Username {
    preload() {
        ui.util.loadFont();
    }
    create() {
        this.stage.backgroundColor = conf.Background.menu;

        this.label = new ui.Text(this.game, 0.3, 0.4, 'Pick a username', {
            width: 0.4,
            height: 0.1
        });

        this.button = new ui.Button(this.game, 0.3, 0.6, 'Start');
        this.input = new ui.InputField(this.game, 0.3, 0.5, {
            width: 0.4,
            placeHolder: 'Username'
        });

        this.button.onClick.add(() => {
            this.game.global.username = this.input.getValue();
            this.game.state.start('mainMenu');
        });
    }
};

module.exports = Username;
