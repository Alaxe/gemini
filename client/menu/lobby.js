'use strict';
const conf = require('../conf.json');
const ui = require('../ui');
const levelData = require('../level-data.json');

class Lobby {
    init(roomData = null) {
        this.data = roomData;
    }
    createUIElements() {
        this.gameCode = new ui.Text(this.game, 0.3, 0.25, '', 0.4, 0.15);
        this.playerNames = [];
        for (let i = 0;i < conf.PLAYER_COUNT;i++) {
            this.playerNames.push(new ui.Text(
                    this.game, 0.25, 0.4 + i * 0.075, '', 0.3, 0.75, {
                        boundsAlignH: 'left'
                    }
            ));
        };

        this.currentLevel = new ui.LevelPreview(this.game, 0.55, 0.4);

        this.start = new ui.Button(this.game, 0.25, 0.6, 'Start', 0.25, 0.1);
        this.leave = new ui.Button(this.game, 0.5, 0.6, 'Leave', 0.25, 0.1);
        this.error = new ui.Error(this.game, 0.3, 0.75, 0.4, 0.1);

        setTimeout(() => {
            this.updateData();
        });
    }
    addEventListeners() {
        this.network = this.game.global.network;
        this.network.clearListeners();

        this.network.on.roomUpdate.add(msg => {
            this.data = msg;
            this.updateData();
        }, this);

        this.network.on.startGame.add(msg => {
            this.state.start('play', true, false, msg.levelIndex);
        }, this);
        this.network.on.lobbyError.add(msg => {
            this.error.setText(msg.content);
        }, this);

        this.currentLevel.onClick.add(() => {
            this.state.start('levelSelect', true, false, this.data);
        });
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
    }

    updateData() {
        this.gameCode.setText('Room Id:\n' + this.data.roomId, true);
        this.currentLevel.setData(levelData[this.data.levelIndex]);

        for (let i = 0;i < this.playerNames.length;i++) {
            if (this.data.players[i]) {
                if (this.data.players[i] == this.game.global.username) {
                    this.data.players[i] += ' (you)';
                }
                this.playerNames[i].setText(' - ' + this.data.players[i]);
            } else {
                this.playerNames[i].setText('Waiting ...');
            }
        }
    }
}

module.exports = Lobby;
