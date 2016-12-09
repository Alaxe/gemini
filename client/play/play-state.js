'use strict';

const conf = require('../conf.json');
const levelData = require('../level-data.json');
const ui = require('../ui');

const Player = require('./player.js');
const LocalPlayer = require('./local-player.js');
const OnlinePlayerManager = require('./online-player-manager.js');

const Level = require('./level.js');
const UseManager = require('./use-highlight.js');

class PlayState {
    constructor() {}

    init(levelIndex) {
        this.levelIndex = levelIndex;
    }
    preload() {
        this.load.image('platforms', '../assets/sprites/platforms.png')
        this.load.image('cables', '../assets/sprites/cables.png')
        this.load.image('diamond', '../assets/sprites/diamond.png');

        Level.loadTilemap(this.game, this.levelIndex);

        this.load.image('player', '../assets/sprites/player.png');
    }
    create() {
        this.createObjects();
        this.createListeners();
    }
    createObjects() {
        this.stage.backgroundColor = conf.Background.play;

        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = conf.GRAVITY;

        this.level = new Level(this.game, this.levelIndex);

        this.network = this.game.global.network;

        this.player = new LocalPlayer(this.game);
        this.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON,
            conf.CAMERA_INTERPOLATION, conf.CAMERA_INTERPOLATION);

        this.useManager = new UseManager(this.game, this.level,
                this.player);

        this.onlinePlayerManager = new OnlinePlayerManager(this.game);
        this.diamondCounter = new ui.DiamondCounter(this.game);
    }
    createListeners() {
        this.network.clearListeners();

        this.level.onTileChange.add(this.network.sendTileUpdate, this.network);

        this.player.onExitReady.add(this.network.sendExitReady, this.network);

        this.network.on.keyframeUpdate.add(this
            .onlinePlayerManager
            .handleKeyframeUpdate,
            this.onlinePlayerManager);

        this.network.on.tileUpdate.add(this.level.onTileUpdate, this.level);

        this.network.on.roomUpdate.add(msg => {
            this.game.state.start('levelEnd', true, false, msg, {
                collected: this.diamondCounter.count,
                all: levelData[this.levelIndex].diamondCount
            });
        });
        this.network.on.diamondPickup.add(msg => {
            let diamond = this.level.diamonds.getAt(msg.id);
            if (diamond.exists) {
                diamond.kill();
                this.diamondCounter.increment();
            }
        }, this);
    }

    update() {
        this.physics.arcade.collide(this.player, this.level.platformLayer);
        this.physics.arcade.collide(this.player, this.level.diamonds,
                (player, diamond) => {
            diamond.kill();
            this.diamondCounter.increment();
            this.network.sendDiamondPickup(diamond.index);
            return true;
        });
        this.network.sendKeyframe(this.player);
    }
};

module.exports = PlayState;
