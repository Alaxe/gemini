'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class MainMenu {
    init() {}
    preload() {
        ui.util.loadFont();
    }
    create() {
        this.stage.backgroundColor = conf.Background.menu;

        this.title = new ui.Text(this.game, 0.3, 0.4, 'Start a game',
        {
            width: 0.4,
            height: 0.1,
        });

        this.createRoom = new ui.Button(this.game, 0.3, 0.5, 'Create a room');
        this.joinRoom = new ui.Button(this.game, 0.3, 0.6, 'Join a room');

        this.createRoom.onClick.add(() => {
            this.game.state.start('lobby');
            this.game.global.network.createRoom();
        });
        this.joinRoom.onClick.add(() => {
            this.game.state.start('joinRoom');
        });

    }
};

module.exports = MainMenu;
