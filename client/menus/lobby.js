'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class Lobby {
    init(roomData = null) {
        this.pendingUpdate = roomData;
    }
    createUIElements() {
        this.gameCode = new ui.Text(this.game, 0.3, 0.25, '', {
            width: 0.4, height: 0.15
        });
        this.playerNames = [];
        for (let i = 0;i < conf.PLAYER_COUNT;i++) {
            this.playerNames.push(new ui.Text(
                    this.game, 0.3, 0.4 + i * 0.075, '', {
                        width: 0.4,
                        height: 0.75,
                        boundsAlignH: 'left'
                    }
            ));
        };

        this.start = new ui.Button(this.game, 0.25, 0.55, 'Start', 0.25, 0.1);
        this.leave = new ui.Button(this.game, 0.5, 0.55, 'Leave', 0.25, 0.1);
        this.error = new ui.Error(this.game, 0.3, 0.7, {
            width: 0.4,
            height: 0.1
        });

        //this.updateData();
        setTimeout(() => {
            this.updateData();
        });
    }
    addEventListeners() {
        this.network = this.game.global.network;
        this.network.clearListeners();

        this.network.on.roomUpdate.add(msg => {
            console.log('received msg', msg);
            this.pendingUpdate = msg;
            this.updateData();
        }, this);

        this.network.on.startGame.add(msg => {
            this.state.start('play');
        }, this);
        this.network.on.lobbyError.add(msg => {
            this.error.setText(msg.content);
        }, this);

        this.start.onClick.add(() => {
            this.network.startGame();
        }, this);
        this.leave.onClick.add(() => {
            this.network.leaveRoom();
            this.state.start('mainMenu');
        }, this);
    }
    create() {
        this.createUIElements();
        this.addEventListeners();
        this.counter = 100;
    }

    updateData() {
        if (this.pendingUpdate) {
            let data = this.pendingUpdate;
            console.log(data);
            if (this.counter < 0) {
                this.pendingUpdate = null;
            }

            this.gameCode.setText('Room Id:\n' + data.roomId, true);

            for (let i = 0;i < this.playerNames.length;i++) {
                if (data.players[i]) {
                    if (data.players[i] == this.game.global.username) {
                        data.players[i] += ' (you)';
                    }
                    this.playerNames[i].setText(' - ' + data.players[i]);
                } else {
                    this.playerNames[i].setText(
                            'Waiting for another player ...');
                }
            }
        }
    }
}

module.exports = Lobby;
