const conf = require('./conf.json');

class Player extends Phaser.Sprite {
    constructor(game, x = 0, y = 0) {
        super(game, x, y, 'player');

        this.game.physics.enable(this, Phaser.Physics.ARCADE);
        this.anchor.setTo(0.5, 0.5);
        
        this.body.collideWorldBounds = true;
        this.body.gravity.y = conf.Player.GRAVITY;

        this.body.maxVelocity.y = conf.Player.MAX_VELOCITY.y;
        this.body.maxVelocity.x = conf.Player.MAX_VELOCITY.x;

        this.nextJump = this.game.time.now;

        this.moveButtons = this.game.input.keyboard.createCursorKeys();
        this.jumpButton = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

        this.game.add.existing(this);
    }

    update() {
        let xVelocity = this.body.onFloor()
            ? conf.Player.WALK_VELOCITY
            : conf.Player.AIR_VELOCITY;

        if (this.moveButtons.right.isDown) {
            this.body.velocity.x = xVelocity;
            this.scale.setTo(1, 1);
        } else if (this.moveButtons.left.isDown) {
            this.body.velocity.x = -xVelocity;
            this.scale.setTo(-1, 1);
        } else {
            this.body.velocity.x = 0;
        }

        
        if ((this.body.onFloor()) && (this.jumpButton.isDown) && 
                (this.game.time.now >= this.nextJump)) {

            this.body.velocity.y -= conf.Player.JUMP_VELOCITY;
            this.nextJump = this.game.time.now + conf.Player.JUMP_INTERVAL_MS;
        }
    }
}

module.exports = Player;
