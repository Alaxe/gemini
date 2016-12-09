const conf = require('../conf.json');
const ui = require('../ui');

class LevelEnd {
    init(roomData, diamonds = 0) {
        this.roomData = roomData;
        this.diamonds = diamonds
    }

    create() {
        this.stage.backgroundColor = conf.Background.menu;
        this.congratulation = new ui.Text(this.game, 0.3, 0.4, 'Level passed',
                0.4, 0.1);

        this.diamonds = new ui.Text(this.game, 0.3, 0.5,
                this.diamonds + " diamonds collected", 0.4, 0.1);

        this.lobby = new ui.Button(this.game, 0.3, 0.6, 'Back to lobby',
                0.4, 0.1, true);


        this.network = this.game.global.network;
        this.network.clearListeners();
        this.network.on.roomUpdate.add(msg => {
            this.roomData = msg;
        });
        this.network.on.startGame.add(msg => {
            this.state.start('play');
        });

        this.lobby.onClick.add(() => {
            this.state.start('lobby', true, false, this.roomData);
        });
    }
};

module.exports = LevelEnd;
