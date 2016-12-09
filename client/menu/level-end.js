const conf = require('../conf.json');
const ui = require('../ui');

class LevelEnd {
    init(roomData, diamondData) {
        this.roomData = roomData;
        this.diamonds = diamondData;
    }

    create() {
        this.stage.backgroundColor = conf.Background.menu;
        this.congratulation = new ui.Text(this.game, 0.3, 0.4, 'Level passed',
                0.4, 0.1);

        let diamondText = this.diamonds.collected + '/' + this.diamonds.all
                + ' diamonds';
        this.diamonds = new ui.Text(this.game, 0.3, 0.5, diamondText, 0.4, 0.1);

        this.lobby = new ui.Button(this.game, 0.3, 0.6, 'Back to lobby',
                0.4, 0.1, true);


        this.network = this.game.global.network;
        this.network.clearListeners();
        this.network.on.roomUpdate.add(msg => {
            this.roomData = msg;
        });
        this.network.on.startGame.add(msg => {
            this.state.start('play', true, false, msg.levelIndex);
        });

        this.lobby.onClick.add(() => {
            this.state.start('lobby', true, false, this.roomData);
        });
    }
};

module.exports = LevelEnd;
