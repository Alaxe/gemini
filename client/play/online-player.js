'use strict';
const conf = require('../conf.json');
const Player = require('./player.js');

let onlinePlayersById = {}

class OnlinePlayer extends Player {
    constructor(game, username) {
        super(game, username);
        this.keyframes = [];

        this.meanTimeDiff = 0;
        this.meanSampleCnt = 0;
    }

    addKeyframe(msg) {
        this.keyframes.push(msg);

        if (this.keyframes.length == 1) {
            this.x = this.keyframes[0].x;
            this.y = this.keyframes[0].y;
        }

    }
    update() {
        /*let netNow = this.game.time.now
                - conf.Player.INTERPOLATION_DELAY_MS
                - this.game.global.network.meanTimeDiff;*/
        let now = this.game.time.now;

        while ((this.keyframes.length > 1) && (this.keyframes[1].time < now)) {
            this.keyframes.shift();
        }

        let prev = this.keyframes[0];
        if (this.keyframes.length > 1) {
            let next = this.keyframes[1];

            let traversedPart = (now - prev.time) / (next.time - prev.time);

            this.x = prev.x + (next.x - prev.x) * traversedPart;
            this.y = prev.y + (next.y - prev.y) * traversedPart;
            if (next.x < this.x) {
                this.setLookDirection(-1);
            } else if (next.x > this.x) {
                this.setLookDirection(1);
            }
        } else {
            this.x = prev.x;
            this.y = prev.y;
        }

        super.update();
    }
}

module.exports = OnlinePlayer;
