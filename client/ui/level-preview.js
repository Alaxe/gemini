const conf = require('../conf.json').LevelPreview;
const levelData = require('../level-data.json');

const Text = require('./text.js');
const util = require('./util.js');
const Button = require('./button.js');

class LevelPreview extends Button {
    static getLevelData(index) {
        if (index !== null) {
            return levelData[index];
        } else {
            return conf.defaultLevelData;
        }
    }
    constructor(game, x, y, index = null) {
        let data = LevelPreview.getLevelData(index);
        super(game, x, y, data.title, conf.width, conf.height, false, conf.Button);
        this.data = data;
    }

    changeIndex(index = null) {
        this.levelData = LevelPreview.getLevelData(index);

        super.setText(this.levelData.title);
    }
};

module.exports = LevelPreview;
