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

        this.title = new ui.Text(this.game, 0.3, 0.4, 'Start a game', 0.4, 0.1);

        this.createRoom = new ui.Button(this.game, 0.3, 0.5, 'Create a room');
        this.joinRoom = new ui.Button(this.game, 0.3, 0.6, 'Join a room');

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

    }
};

module.exports = MainMenu;
