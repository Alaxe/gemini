'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class JoinRoom {
    preload() {}
    onJoinError(msg) {
        this.error.setText(msg.content);
    }

    create() {
        this.stage.backgroundColor = conf.Background.menu;

        this.title = new ui.Text(this.game, 0.3, 0.35, 'Enter room code', {
            width: 0.4,
            height: 0.1
        });
        this.idInput = new ui.InputField(this.game, 0.3, 0.45, {
            width: 0.4,
            placeHolder: 'Room Id'
        });
        this.error = new ui.Error(this.game, 0.3, 0.65, {
            width: 0.4,
            height: 0.1
        });

        this.join = new ui.Button(this.game, 0.3, 0.55, 'Join', 0.2, 0.1, true);
        this.back = new ui.Button(this.game, 0.5, 0.55, 'Back', 0.2, 0.1);

        this.back.onClick.add(() => {
            this.game.state.start('mainMenu');
        });

        let network = this.game.global.network;

        this.join.onClick.add(() => {
            network.joinRoom(this.idInput.getValue());
        });

        network.onJoinError.add(this.onJoinError, this);
        network.onRoomUpdate.addOnce((msg) => {
            network.onJoinError.remove(this.onJoinError, this);
            this.state.start('lobby', true, false, msg);
        }, this);
    }
};

module.exports = JoinRoom;
