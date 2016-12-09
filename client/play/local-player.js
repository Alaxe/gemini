'use strict';
const conf = require('../conf.json');
const Player = require('./player.js');

class LocalPlayer extends Player {
    constructor(game, x = 0, y = 0) {
        super(game, 'you', x, y);

        this.game.physics.enable(this, Phaser.Physics.ARCADE);

        this.body.collideWorldBounds = true;
        this.body.gravity.y = conf.Player.GRAVITY;

        this.body.maxVelocity.y = conf.Player.MAX_VELOCITY.y;
        this.body.maxVelocity.x = conf.Player.MAX_VELOCITY.x;

        this.nextJump = this.game.time.now;

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.jump = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

        this.onExitBlockCollide = new Phaser.Signal();
        this.onExitBlockCollide.add(tile => {
            if (tile.worldY > this.y) {
                this.onExitBlock = true;
            }
        });

        this.onExitReady = new Phaser.Signal();

        this.onExitBlock = false;
        this.prevOnExitBlock = false;
    }

    update() {
        let xVelocity = this.body.onFloor()
            ? conf.Player.WALK_VELOCITY
            : conf.Player.AIR_VELOCITY;

        if (this.cursors.right.isDown) {
            this.body.velocity.x = xVelocity;
        } else if (this.cursors.left.isDown) {
            this.body.velocity.x = -xVelocity;
        } else {
            this.body.velocity.x = 0;
        }

        if ((this.body.onFloor()) && (this.jump.isDown) &&
                (this.game.time.now >= this.nextJump)) {

            this.body.velocity.y -= conf.Player.JUMP_VELOCITY;
            this.nextJump = this.game.time.now + conf.Player.JUMP_INTERVAL_MS;
        }

        if (this.body.velocity.x < 0) {
            this.setLookDirection(-1);
        } else if (this.body.velocity.x > 0) {
            this.setLookDirection(1);
        }

        if (!(this.body.onFloor()) || (this.body.velocity.x != 0)) {
            this.onExitBlock = false;
        }

        if (this.onExitBlock != this.prevOnExitBlock) {
            this.onExitReady.dispatch(this.onExitBlock);
        }

        this.prevOnExitBlock = this.onExitBlock;
        this.onExitBlock = false;
    }
}

module.exports = LocalPlayer;
