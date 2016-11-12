const Player = require('./player.js');
const conf = require('./conf.json');

class OnlinePlayer extends Player {
    constructor(game) {
        super(game);
        this.keyframes = [];

        this.meanTimeDiff = 0;
        this.meanSampleCnt = 0;
    }

    add_keyframe(msg) {
        //msg.time = this.game.time.now;
        this.keyframes.push(msg);

        if (this.keyframes.length == 1) {
            this.x = this.keyframes[0].x;
            this.y = this.keyframes[0].y;
        }

        let timeDiff = this.game.time.now - msg.time;

        this.meanTimeDiff *= this.meanSampleCnt / (this.meanSampleCnt + 1);
        this.meanSampleCnt++;

        this.meanTimeDiff += timeDiff / this.meanSampleCnt;
        console.log(this.meanTimeDiff);
    }
    update() {
        let netNow = this.game.time.now
                - conf.Player.INTERPOLATION_DELAY_MS
                - this.meanTimeDiff;

        while ((this.keyframes.length > 1) && (this.keyframes[1].time < netNow)) {
            this.keyframes.shift();
        }

        let prev = this.keyframes[0];
        if (this.keyframes.length > 1) {
            let next = this.keyframes[1];

            let traversedPart = (netNow - prev.time) / (next.time - prev.time);

            this.x = prev.x + (next.x - prev.x) * traversedPart;
            this.y = prev.y + (next.y - prev.y) * traversedPart;
        } else {
            console.log('Not enough keyframes');
            this.x = prev.x;
            this.y = prev.y;
        }
    }
}

module.exports = OnlinePlayer;
