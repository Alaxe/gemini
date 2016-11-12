const conf = require('./conf.json');

class Player extends Phaser.Sprite {
    constructor(game, x = 0, y = 0) {
        super(game, x, y, 'player');

        ///Should add animations

        this.anchor.setTo(0.5, 0.5);
        this.game.add.existing(this);
    }
}

module.exports = Player;
