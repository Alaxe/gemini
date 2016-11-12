const OnlinePlayer = require('./online-player.js');

class OnlinePlayerManager {
    constructor(game, network) {
        this.game = game;
        this.playersById = {}
    }

    getPlayerById(id) {
        if (!(id in this.playersById)) {
            this.playersById[id] = new OnlinePlayer(this.game);
        }
        return this.playersById[id];
    }

    handleKeyframeUpdate(msg) {
        let player = this.getPlayerById(msg.playerId);
        player.addKeyframe(msg);
    }
}
module.exports = OnlinePlayerManager;
