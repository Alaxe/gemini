'use strict';
const conf = require('../conf.json');
const ui = require('../ui');
const levelData = require('../level-data.json');

class LevelSelect {
    constructor() {}
    init(roomData) {
        this.roomData = roomData; 
    }
    create() {
        let previews = [];

        let width = conf.LevelPreview.width * conf.LevelSelect.hCnt;
        let height = conf.LevelPreview.height * conf.LevelSelect.vCnt;

        let startX = (1 - width) / 2;
        let startY = (1 - height) / 2;

        for (let i = 0;i < levelData.length;i++) {
            let gridX = i % conf.LevelSelect.hCnt;
            let gridY = Math.floor(i / conf.LevelSelect.vCnt);

            let x = startX + gridX * conf.LevelPreview.width;
            let y = startY + gridY * conf.LevelPreview.height;

            let cur = new ui.LevelPreview(this.game, x, y, levelData[i]);

            cur.onClick.add(() => {
                this.network.selectLevel(i);
                this.roomData.levelIndex = i;
                this.state.start('lobby', true, false, this.roomData);
            });
        }

        this.network = this.game.global.network;
        this.network.clearListeners();
        this.network.on.roomUpdate.add(msg => {
            this.roomData = msg;
        });
        this.network.on.startGame.add(msg => {
            this.state.start('play', true, false, msg.levelIndex);
        });
    }
};

module.exports = LevelSelect;
