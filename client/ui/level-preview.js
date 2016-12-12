const conf = require('../conf.json');
const levelData = require('../level-data.json');

const Text = require('./text.js');
const util = require('./util.js');
const Button = require('./button.js');

class LevelPreview extends Button {
    static getLevelData(index) {
        if (index === null) {
            return conf.LevelPreview.defaultLevelData;
        }
        let localData = JSON.parse(localStorage.getItem('levelData-' + index));
        return Object.assign({}, conf.LevelPreview.defaultLevelData,
                levelData[index], localData);
    }
    constructor(game, x, y, index = null) {
        let data = LevelPreview.getLevelData(index);
        super(game, x, y, data.title, conf.LevelPreview.width,
                conf.LevelPreview.height, false, conf.LevelPreview.Button);
        //
        //console.log(util.hPx(conf.width - 32));

        let hMargin = conf.LevelPreview.Button.hMargin
            ? conf.LevelPreview.Button.hMargin
            : conf.Button.hMargin;
        hMargin += conf.LevelPreview.iconOffset;

        let vMargin = conf.LevelPreview.Button.vMargin
            ? conf.LevelPreview.Button.vMargin
            : conf.Button.vMargin;
        vMargin += conf.LevelPreview.iconOffset;

        this.diamond = game.add.sprite(hMargin, vMargin, 'diamond');
        this.diamond.width = this.diamond.height = conf.LevelPreview.iconSize;
        this.diamond.visible = data.perfect;
        this.add(this.diamond);

        let tickX = util.hPx(conf.LevelPreview.width) -
                hMargin -
                conf.LevelPreview.iconSize;

        this.tick = game.add.sprite(tickX, vMargin, 'tick');
        this.tick.width = this.tick.height = conf.LevelPreview.iconSize;
        this.tick.visible = data.passed;
        this.add(this.tick);


        this.data = data;
    }

    changeIndex(index = null) {
        this.levelData = LevelPreview.getLevelData(index);
        this.diamond.visible = this.levelData.perfect;
        this.tick.visible = this.levelData.passed;

        super.setText(this.levelData.title);
    }
};

module.exports = LevelPreview;
