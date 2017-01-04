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

    init(msg) {
        this.levelIndex = msg.levelIndex;
        this.spawnIndex = msg.playerIndex;
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
        this.sfx = this.game.global.sfx;

        this.game.global.soundtrack.play('level');

        let playerSpawn = this.level.getSpawnPosition(this.spawnIndex);
        this.player = new LocalPlayer(this.game, playerSpawn.x, playerSpawn.y);

        this.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON,
            conf.CAMERA_INTERPOLATION, conf.CAMERA_INTERPOLATION);
        this.camera.focusOn(this.player);

        this.useManager = new UseManager(this.game, this.level,
                this.player);
        this.useManager.onUse.add(this.level.onUseTile, this.level);

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
        this.network.on.levelEnd.add(this.onLevelEnd, this);
        this.network.on.diamondPickup.add(this.onDiamondPickup, this);

        this.sfx.initNetwork();
    }

    onLevelEnd(msg) {
        if (msg.passed) {
            this.sfx.play('teleport');
            let key = 'levelData-' + this.levelIndex;
            let data = JSON.parse(localStorage.getItem(key)) || {};

            data.passed = true;

            let diamondData = {
                collected: this.diamondCounter.count,
                all: this.level.diamondCount
            };
            if (diamondData.collected == diamondData.all) {
                data.perfect = true;
            }
            localStorage.setItem(key, JSON.stringify(data));

            this.game.state.start('levelEnd', true, false, msg, diamondData);
        } else {
            this.game.state.start('lobby', true, false, msg.roomUpdate);
        }
    }

    onDiamondPickup(msg) {
        let diamond = this.level.diamonds.getAt(msg.id);
        if (diamond.exists) {
            diamond.kill();
            this.diamondCounter.increment();
        }
    }

    update() {
        this.physics.arcade.collide(this.player, this.level.platformLayer);
        this.physics.arcade.collide(this.player, this.level.diamonds,
                (player, diamond) => {
            diamond.kill();
            this.diamondCounter.increment();
            this.network.sendDiamondPickup(diamond.index);
            this.sfx.playBroadcast('pickup', diamond.x, diamond.y);
            return true;
        });
        this.game.global.sfx.updateListener(this.player.x, this.player.y);
        this.network.sendKeyframe(this.player);
    }
};

module.exports = PlayState;
