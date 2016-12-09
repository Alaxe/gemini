const conf = require('../conf.json').LevelPreview;
const Text = require('./text.js');
const util = require('./util.js');
const Button = require('./button.js');

class LevelPreview extends Button {
    constructor(game, x, y, levelData = {}) {
        let text = levelData.title
            ? levelData.title
            : '';

        super(game, x, y, text, conf.width, conf.height, false, conf.Button);
        this.levelData = levelData;
    }
    setData(data) {
        this.levelData = data;
        super.setText(data.title);
    }
};

module.exports = LevelPreview;
