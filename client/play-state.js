'use strict';

const conf = require('./conf.json');

const Player = require('./player.js');
const LocalPlayer = require('./local-player.js');
const OnlinePlayerManager = require('./online-player-manager.js');

const NetworkManager = require('./network-manager.js');
const Level = require('./level.js');
const UseManager = require('./use-highlight.js');


class PlayState {
    constructor() {}

    preload() {
        this.load.image('platforms', '../assets/platforms.png')
        this.load.image('cables', '../assets/cables.png')
        this.load.tilemap('map', '../assets/level.json', null,
            Phaser.Tilemap.TILED_JSON);

        this.load.image('player', '../assets/player.png');
    }
    create() {
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = conf.GRAVITY;

        this.level = new Level(this.game);

        this.player = new LocalPlayer(this.game);
        this.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON,
            conf.CAMERA_INTERPOLATION, conf.CAMERA_INTERPOLATION);

        this.network = new NetworkManager(this.game);

        this.useManager = new UseManager(this.game, this.level,
                this.player);

        this.level.onTileChange.add(this.network.sendTileUpdate
                .bind(this.network));

        this.onlinePlayerManager = new OnlinePlayerManager(this.game);
        this.network.onKeyframeUpdate.add(this
            .onlinePlayerManager
            .handleKeyframeUpdate
            .bind(this.onlinePlayerManager));

        this.network.onTileUpdate.add(this.level.onTileUpdate.bind(this.level));
        this.network.onTileUpdate.add(console.log);
    }

    update() {
        this.physics.arcade.collide(this.player, this.level.platformLayer);
        this.network.sendKeyframe(this.player);
    }
};

module.exports = PlayState;
