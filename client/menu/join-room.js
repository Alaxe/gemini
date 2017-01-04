'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class JoinRoom {
    onJoinError(msg) {
        this.error.setText(msg.content);
    }

    create() {
        this.stage.backgroundColor = conf.Background.menu;

        this.title = new ui.Text(this.game, 0.3, 0.35, 'Enter room code',
                0.4, 0.1);

        this.idInput = new ui.InputField(this.game, 0.3, 0.45, {
            width: 0.4,
            placeHolder: 'Room Id'
        });
        this.error = new ui.Error(this.game, 0.2, 0.65, 0.6, 0.1);

        this.join = new ui.Button(this.game, 0.3, 0.55, 'Join', 0.2, 0.1, {
            enterActivate: true
        });
        this.back = new ui.Button(this.game, 0.5, 0.55, 'Back', 0.2, 0.1);

        this.back.onClick.add(() => {
            this.game.state.start('mainMenu');
        });

        this.network = this.game.global.network;
        this.network.clearListeners();

        this.join.onClick.add(() => {
            this.network.joinRoom(this.idInput.getValue().toLowerCase());
        });

        this.network.on.joinError.add(this.onJoinError, this);
        this.network.on.roomUpdate.addOnce((msg) => {
            this.state.start('lobby', true, false, msg);
        });

        this.game.global.soundtrack.play('menu');
    }
};

module.exports = JoinRoom;
