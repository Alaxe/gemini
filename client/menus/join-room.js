'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class JoinRoom {
    preload() {}
    create() {
        this.title = new ui.Text(this.game, 0.3, 0.35, 'Enter room code', {
            width: 0.4,
            height: 0.1
        });
        this.idInput = new ui.InputField(this.game, 0.3, 0.45, {
            width: 0.4,
            placeHolder: 'Room Id'
        });

        this.join = new ui.Button(this.game, 0.3, 0.55, 'Join', 0.2, 0.1);
        this.back = new ui.Button(this.game, 0.5, 0.55, 'Back', 0.2, 0.1);

        this.back.onClick.add(() => {
            this.game.state.start('mainMenu');
        });
    }
};

module.exports = JoinRoom;
