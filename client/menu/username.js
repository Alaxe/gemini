'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class Username {
    preload() {
        ui.util.loadFont();
        this.game.global.soundtrack.load();
    }
    create() {
        this.stage.backgroundColor = conf.Background.menu;

        this.label = new ui.Text(this.game, 0.3, 0.4, 'Pick a username',
                0.4, 0.1);

        this.button = new ui.Button(this.game, 0.3, 0.6, 'Start', 0.4, 0.1, true);
        this.input = new ui.InputField(this.game, 0.3, 0.5, {
            width: 0.4,
            placeHolder: 'Username'
        });

        this.button.onClick.add(() => {
            localStorage.setItem('username', this.input.getValue());
            this.game.state.start('mainMenu');
        });

        this.game.global.soundtrack.play('menu');
    }
};

module.exports = Username;
