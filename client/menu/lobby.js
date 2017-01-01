'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class Lobby {
    init(roomData = null) {
        this.data = roomData;
    }
    preload() {
        this.load.image('diamond', '../assets/sprites/diamond.png');
        this.load.image('tick', '../assets/sprites/tick.png');
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

        this.currentLevel = new ui.LevelPreview(this.game, 0.525, 0.4);

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
            this.state.start('play', true, false, msg);
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

        this.game.global.soundtrack.play('menu');
    }

    updateData() {
        this.gameCode.setText('Room Id:\n' + this.data.roomId, true);
        this.currentLevel.changeIndex(this.data.levelIndex);

        let foundYou = false;
        for (let i = 0;i < this.playerNames.length;i++) {
            if (this.data.players[i]) {
                let curText = ' - ' + this.data.players[i];
                if (this.data.players[i] == localStorage.getItem('username')) {
                    if (!foundYou) {
                        curText += ' (you)';
                        foundYou = true;
                    }
                }
                this.playerNames[i].setText(curText);
            } else {
                this.playerNames[i].setText('Waiting ...');
            }
        }
    }
}

module.exports = Lobby;
