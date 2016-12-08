'use strict';
const OnlinePlayer = require('./online-player.js');

class OnlinePlayerManager {
    constructor(game, network) {
        this.game = game;
        this.playersById = {}
    }

    getKeyframePlayer(msg) {
        let id = msg.id;
        if (!(id in this.playersById)) {
            this.playersById[id] = new OnlinePlayer(this.game, msg.username);
        }
        return this.playersById[id];
    }

    handleKeyframeUpdate(msg) {
        let player = this.getKeyframePlayer(msg);
        player.addKeyframe(msg);
    }
}
module.exports = OnlinePlayerManager;
