const conf = require('./conf.json');
const levelData = require('./level-data.json');

const ui = require('./ui');

class Loader {
    create() {
        this.stage.backgroundColor = conf.Background.menu;

        this.bar = new ui.ProgressBar(this.game, 0.2, 0.45);

        this.initLoading();
        this.load.onFileComplete.add(progress => {
            this.bar.setProgress(progress / 100);
        });
        this.load.onLoadComplete.add(() => {
            this.state.start('mainMenu');
        });
    }

    initLoading() {
        ui.util.loadFont();

        for (let sprite of conf.Loader.sprites) {
            this.load.image(sprite, `${conf.Loader.spritesRoot}${sprite}.png`);
        }
        for (let effect of conf.SFX.effects) {
            this.load.audio(effect, `${conf.SFX.root}${effect}.wav`);
        }
        for (let track of conf.Soundtrack.tracks) {
            this.load.audio(track, `${conf.Soundtrack.root}${track}.ogg`);
        }
        for (let i = 0;i < levelData.length;i++) {
            this.load.tilemap('map-' + i, levelData[i].path, null,
                    Phaser.Tilemap.TILED_JSON);
        }
        this.load.start();
    }
};

module.exports = Loader;
