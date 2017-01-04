'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class MainMenu {
    init() {
        if (!localStorage.getItem('username')) {
            this.state.start('username');
        }
    }
    create() {
        this.stage.backgroundColor = conf.Background.menu;

        this.title = new ui.Text(this.game, 0.3, 0.25, 'Gemini', 0.4, 0.1, {
            font: '35px Roboto'
        });

        this.createRoom = new ui.Button(this.game, 0.3, 0.4, 'Create a room');
        this.joinRoom = new ui.Button(this.game, 0.3, 0.5, 'Join a room');
        this.options = new ui.Button(this.game, 0.3, 0.6, 'Options');

        this.network = this.game.global.network;
        this.network.clearListeners();

        this.createRoom.onClick.add(() => {
            this.network.createRoom();
        });
        this.network.on.roomUpdate.add(msg => {
            this.game.state.start('lobby', true, false, msg);
        });
        this.joinRoom.onClick.add(() => {
            this.game.state.start('joinRoom');
        });
        this.options.onClick.add(() => {
            this.game.state.start('options');
        });

        this.game.global.soundtrack.play('menu');
    }
};

module.exports = MainMenu;
